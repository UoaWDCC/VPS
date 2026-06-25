import { useContext, useState } from "react";
import ModalDialog from "../../../components/ModalDialogue";
import Chip from "./Chip";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { api } from "../../../util/api";
import AuthenticationContext from "../../../context/AuthenticationContext";
import { Undo2Icon, XIcon } from "lucide-react";
import toast from "react-hot-toast";

async function getAccessList(user, id) {
  const res = await api.get(user, `api/access/${id}`);
  return res.data?.accessList;
}

async function grantAccess(user, id, email) {
  const res = await api.patch(user, `api/access/${id}/grant`, { email });
  return res.data?.accessList;
}

async function revokeAccess(user, id, emails) {
  const res = await api.patch(user, `api/access/${id}/revoke`, { emails });
  return res.data?.accessList;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function ShareModal({ open, setOpen }) {
  const { user } = useContext(AuthenticationContext);
  const { scenarioId } = useParams();
  const queryClient = useQueryClient();

  const [value, setValue] = useState(null);
  const [tentativeRevokees, setTentativeRevokees] = useState([]);

  function tentativelyRevoke(email) {
    setTentativeRevokees((prev) => [...prev, email]);
  }

  function unTentativelyRevoke(email) {
    setTentativeRevokees((prev) => prev.filter((e) => e !== email));
  }

  const accessQuery = useQuery({
    queryKey: ["access", scenarioId],
    queryFn: () => getAccessList(user, scenarioId),
    enabled: !!scenarioId,
  });

  const revokeMutation = useMutation({
    mutationFn: (emails) => revokeAccess(user, scenarioId, emails),
    onSuccess: (data, emails) => {
      queryClient.setQueryData(["access", scenarioId], data);
      queryClient.invalidateQueries({ queryKey: ["access", scenarioId] });
      setTentativeRevokees((prev) => prev.filter((e) => !emails.includes(e)));
    },
    onError: () => {
      toast.error("Something went wrong revoking access from the scenario");
    },
  });

  const grantMutation = useMutation({
    mutationFn: (email) => grantAccess(user, scenarioId, email),
    onSuccess: (data) => {
      queryClient.setQueryData(["access", scenarioId], data);
      queryClient.invalidateQueries({ queryKey: ["access", scenarioId] });
      setValue(null);
    },
    onError: () => {
      toast.error("Something went wrong sharing the scenario");
    },
  });

  function grantMutationWrapper(email) {
    if (accessQuery.data?.includes(email)) {
      toast.error("This email already has access");
      return;
    }
    grantMutation.mutate(email);
  }

  function closeDialog() {
    setValue(null);
    setTentativeRevokees([]);
    setOpen(false);
  }

  return (
    <ModalDialog title="Share Scenario" open={open} onClose={closeDialog}>
      <fieldset className="fieldset">
        <div className="join w-full">
          <input
            type="text"
            inputMode="email"
            value={value ?? ""}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Enter email address"
            className="input join-item flex-grow"
          />
          <button
            className="btn join-item"
            type="button"
            onClick={() => grantMutationWrapper(value)}
            disabled={!isValidEmail(value) || grantMutation.isPending}
          >
            {grantMutation.isPending ? "Sharing" : "Share"}
          </button>
        </div>
        {accessQuery.isLoading && <span>Fetching access list...</span>}
        {accessQuery.isError && <span>Failed to fetch access list</span>}
        {accessQuery.data?.length ? (
          <>
            <label className="label">Shared Users</label>
            <div className="flex gap-2 flex-wrap">
              {accessQuery.data.map((email) =>
                tentativeRevokees.includes(email) ? (
                  <Chip
                    key={email}
                    text={email}
                    struck={true}
                    onAction={() => unTentativelyRevoke(email)}
                    Icon={Undo2Icon}
                  />
                ) : (
                  <Chip
                    key={email}
                    text={email}
                    onAction={() => tentativelyRevoke(email)}
                    Icon={XIcon}
                  />
                )
              )}
            </div>
          </>
        ) : null}
      </fieldset>
      <div className="modal-action flex gap-2">
        <button
          className="btn"
          disabled={revokeMutation.isPending || grantMutation.isPending}
        >
          Cancel
        </button>
        {tentativeRevokees.length !== 0 ? (
          <button
            type="button"
            disabled={revokeMutation.isPending || grantMutation.isPending}
            className="btn"
            onClick={() => revokeMutation.mutate(tentativeRevokees)}
          >
            {revokeMutation.isPending ? "Saving" : "Save"}
          </button>
        ) : (
          <button disabled={grantMutation.isPending} className="btn">
            Done
          </button>
        )}
      </div>
    </ModalDialog>
  );
}

export default ShareModal;
