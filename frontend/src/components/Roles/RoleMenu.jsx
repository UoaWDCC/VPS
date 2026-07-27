import { useContext } from "react";
import { useParams } from "react-router-dom";
import CreateRole from "./CreateRole";
import ScenarioContext from "context/ScenarioContext";
import AuthenticationContext from "../../context/AuthenticationContext";
import { api } from "../../util/api";
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

  const { roleList, setRoleList } = useContext(ScenarioContext);

  if (!roleList) return null;

  function deleteRole(role) {
    api
      .delete(
        user,
        `/api/scenario/${scenarioId}/roles/${encodeURIComponent(role)}`
      )
      .then((response) => {
        setRoleList(response.data);
        toast.success("Role deleted successfully");
      })
      .catch((error) => {
        console.error("Error deleting role:", error);
        toast.error("Error deleting role");
      });
  }

  return (
    <ModalDialog title="Roles" open={show} onClose={() => setShow(false)}>
      <CreateRole scenarioId={scenarioId} />
      <div className="divider" />
      <div className="flex flex-col gap-xs">
        {roleList.map((role, i) => (
          <fieldset
            key={i}
            className="fieldset bg-base-200 border-base-300 rounded-box border p-4 flex-row items-center"
          >
            <span className="flex-1">{role}</span>
            <button
              className="btn btn-xs btn-phantom"
              onClick={() => deleteRole(role)}
            >
              Delete
            </button>
          </fieldset>
        ))}
      </div>
    </ModalDialog>
  );
};

export default RoleMenu;
