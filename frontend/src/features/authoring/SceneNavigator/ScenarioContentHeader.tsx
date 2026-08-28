import { useState } from "react";
import { useHistory, useParams } from "react-router-dom";
import { FilesIcon, SlidersHorizontalIcon } from "lucide-react";
import PropertyMenu from "../../../components/Properties/PropertyMenu";

/**
 * Scenario-level controls, sitting above the scene list so that they read as
 * belonging to the whole scenario rather than the current scene.
 * @component
 */
export default function ScenarioContentHeader() {
  const { scenarioId } = useParams<{ scenarioId: string }>();
  const history = useHistory();

  const [showProperties, setShowProperties] = useState(false);

  return (
    <>
      <PropertyMenu show={showProperties} setShow={setShowProperties} />
      <div className="flex flex-col gap-1 pb-s pr-3">
        <button
          type="button"
          className="btn btn-phantom btn-sm justify-start text-xs"
          onClick={() => setShowProperties(true)}
        >
          <SlidersHorizontalIcon size={16} />
          Properties
        </button>
        <button
          type="button"
          className="btn btn-phantom btn-sm justify-start text-xs"
          onClick={() =>
            history.push(`/scenario/${scenarioId}/manage-resources`)
          }
        >
          <FilesIcon size={16} />
          Player Documents
        </button>
      </div>
    </>
  );
}
