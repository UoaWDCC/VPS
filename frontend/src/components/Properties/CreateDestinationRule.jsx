import { useContext, useState } from "react";
import SceneContext from "../../context/SceneContext";
import ScenarioContext from "../../context/ScenarioContext";
import SelectInput from "../../features/authoring/components/Select";
import { modifyComponentProp } from "../../features/authoring/scene/operations/component";
import ModalDialog from "../ModalDialogue";
import RuleValue from "./RuleValue";
import {
  getDefaultValue,
  propertyTypes,
  validComparators,
} from "./propertyTypes";

/**
 * Component used for creating destination rules
 * A destination rule sends the player to a scene when a property meets a
 * condition, and they're checked in order after the button's own operations
 *
 * @component
 */
const CreateDestinationRule = ({ component, open, setOpen }) => {
  const { properties } = useContext(ScenarioContext);
  const { scenes } = useContext(SceneContext);

  const [property, setProperty] = useState(null);
  const [comparator, setComparator] = useState("=");
  const [value, setValue] = useState(null);
  const [sceneId, setSceneId] = useState(null);

  const close = () => {
    setProperty(null);
    setComparator("=");
    setValue(null);
    setSceneId(null);
    setOpen(false);
  };

  if (!properties?.length) {
    return (
      <ModalDialog title="Create Destination Rule" open={open} onClose={close}>
        <div className="text-s">
          No properties found for this scenario. You can create some in the
          &apos;Properties&apos; menu in the toolbar above.
        </div>
      </ModalDialog>
    );
  }

  const isNumber = property?.type === propertyTypes.NUMBER;
  const isSubmittable =
    property && sceneId && value != null && !(isNumber && value === "");

  const handleSubmit = () => {
    if (!isSubmittable) return;

    const rule = {
      stateVariableId: property.id,
      comparator,
      value: isNumber ? Number(value) : value,
      sceneId,
    };

    modifyComponentProp([component.id], "nextSceneRules", (prev) => [
      ...(prev ?? []),
      rule,
    ]);
    close();
  };

  function onPropertyChange(next) {
    setProperty(next);
    setComparator("=");
    setValue(getDefaultValue(next.type));
  }

  return (
    <ModalDialog title="Create Destination Rule" open={open} onClose={close}>
      <fieldset className="fieldset">
        <label className="label">If this property</label>
        <SelectInput
          values={properties}
          value={property}
          display={(p) => p.name}
          onChange={onPropertyChange}
        />
        {property ? (
          <>
            <label className="label">Is</label>
            <div className="join">
              <SelectInput
                values={validComparators[property.type]}
                value={comparator}
                onChange={setComparator}
              />
              <RuleValue
                type={property.type}
                value={value}
                onChange={setValue}
              />
            </div>
            <label className="label">Go to</label>
            <SelectInput
              values={scenes?.map((s) => s._id) ?? []}
              value={sceneId}
              display={(id) =>
                scenes.find((s) => s._id === id)?.name ?? "Missing scene"
              }
              onChange={setSceneId}
            />
          </>
        ) : null}
      </fieldset>
      <div className="modal-action flex gap-2">
        <button
          type="button"
          className={`btn ${!isSubmittable && "btn-disabled"}`}
          onClick={handleSubmit}
        >
          Create
        </button>
      </div>
    </ModalDialog>
  );
};

export default CreateDestinationRule;
