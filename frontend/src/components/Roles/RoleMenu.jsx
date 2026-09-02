import { useContext } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { Trash2Icon } from "lucide-react";
import CreateRole from "./CreateRole";
import ScenarioContext from "context/ScenarioContext";
import AuthenticationContext from "../../context/AuthenticationContext";
import { api } from "../../util/api";
import { rolesQueryKey } from "../../context/ScenarioContextProvider";
import toast from "react-hot-toast";
import ModalDialog from "../ModalDialogue";

/**
 * Component used for creating, viewing, and deleting roles
 *
 * @component
 * @example
 * const [show, setShow] = useState(false);
 * return (
 *   <Button onClick={() => setShow(true)}>Open Role Menu</Button>
 *   <RoleMenu show={show} setShow={setShow} />
 * )
 */
const RoleMenu = ({ show, setShow }) => {
  const { scenarioId } = useParams();
  const { user } = useContext(AuthenticationContext);

  const { roleList } = useContext(ScenarioContext);
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (role) =>
      api.delete(
        user,
        `/api/scenario/${scenarioId}/roles/${encodeURIComponent(role)}`
      ),
    onSuccess: (response) => {
      queryClient.setQueryData(rolesQueryKey(scenarioId), response.data);
      toast.success("Role deleted successfully");
    },
    onError: (error) => {
      console.error("Error deleting role:", error);
      toast.error("Error deleting role");
    },
  });

  if (!roleList) return null;

  return (
    <ModalDialog title="Roles" open={show} onClose={() => setShow(false)}>
      <CreateRole scenarioId={scenarioId} />
      <div className="divider" />
      {roleList.length > 0 && (
        <div className="overflow-x-auto rounded-box border border-base-content/5 w-full">
          <table className="table table-zebra">
            <thead>
              <tr>
                <th>Name</th>
                <th className="w-0" />
              </tr>
            </thead>
            <tbody>
              {roleList.map((role, i) => (
                <tr key={i}>
                  <td>{role}</td>
                  <td className="text-right">
                    <button
                      type="button"
                      className="btn btn-xs btn-square btn-ghost"
                      aria-label={`Delete role ${role}`}
                      onClick={() => deleteMutation.mutate(role)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2Icon size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </ModalDialog>
  );
};

export default RoleMenu;
