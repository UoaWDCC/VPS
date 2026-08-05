import { useState, useContext } from "react";
import { api } from "../../util/api";
import AuthenticationContext from "../../context/AuthenticationContext";
import ScenarioContext from "../../context/ScenarioContext";
import toast from "react-hot-toast";

/**
 * Component used for creating roles
 *
 * @component
 * @example
 * return (
 *  <CreateRole scenarioId={scenarioId} />
 * )
 */
const CreateRole = ({ scenarioId }) => {
  const { user } = useContext(AuthenticationContext);
  const { roleList, setRoleList } = useContext(ScenarioContext);

  const [role, setRole] = useState("");

  function handleSubmit(e) {
    e.preventDefault();

    const trimmed = role.trim();
    if (roleList?.some((r) => r.toLowerCase() === trimmed.toLowerCase())) {
      toast.error(`Role "${trimmed}" already exists`);
      return;
    }

    const previousCount = roleList?.length ?? 0;

    api
      .post(user, `/api/scenario/${scenarioId}/roles`, { role: trimmed })
      .then((response) => {
        setRoleList(response.data);
        if (response.data.length > previousCount) {
          toast.success("Role created successfully");
          setRole("");
        } else {
          // another client created the same role (case-insensitively) first
          toast.error(`Role "${trimmed}" already exists`);
        }
      })
      .catch((error) => {
        console.error("Error creating role:", error);
        toast.error("Error creating role");
      });
  }

  const isSubmittable = role.trim().length > 0;

  function handleKeyDown(e) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    if (isSubmittable) handleSubmit(e);
  }

  return (
    <fieldset className="fieldset bg-base-200 border-base-300 rounded-box border p-4">
      <legend className="fieldset-legend">New Role</legend>
      <div className="flex wrap gap-xs">
        <div className="flex flex-col flex-1">
          <label className="label mb-1">Name</label>
          <input
            type="text"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Name"
            className="input w-full"
          />
        </div>
      </div>
      <button
        type="button"
        className={`ml-auto btn btn-xs btn-phantom float-right ${!isSubmittable && "btn-disabled"}`}
        onClick={handleSubmit}
      >
        Create
      </button>
    </fieldset>
  );
};

export default CreateRole;
