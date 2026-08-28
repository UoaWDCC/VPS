import CreateProperty from "./CreateProperty";
import { useParams } from "react-router-dom/cjs/react-router-dom.min";
import ScenarioContext from "context/ScenarioContext";
import { useContext } from "react";
import EditProperty from "./EditProperty";
import ModalDialog from "../ModalDialogue";

/**
 * Component used for creating, editing, and deleting properties
 *
 * @component
 * @example
 * const [show, setShow] = useState(false);
 * return (
 *   <Button onClick={() => setShow(true)}>Open Property Menu</Button>
 *   <PropertyMenu show={show} setShow={setShow} />
 * )
 */
const PropertyMenu = ({ show, setShow }) => {
  const { scenarioId } = useParams();

  const { properties } = useContext(ScenarioContext);

  if (!properties) return null;

  return (
    <ModalDialog
      wide
      title="Properties"
      open={show}
      onClose={() => setShow(false)}
    >
      <CreateProperty scenarioId={scenarioId} />
      <div className="divider" />
      <div className="flex flex-col gap-xs">
        {properties.map((property, i) => (
          <EditProperty key={i} property={property} scenarioId={scenarioId} />
        ))}
      </div>
    </ModalDialog>
  );
};

export default PropertyMenu;
