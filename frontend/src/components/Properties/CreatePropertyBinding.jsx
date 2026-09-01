import { useContext, useMemo, useState } from "react";
import ScenarioContext from "../../context/ScenarioContext";
import { modifyComponentProp } from "../../features/authoring/scene/operations/component";
import SelectInput from "../../features/authoring/components/Select";
import ModalDialog from "../ModalDialogue";
import { getComponentBindingTargets } from "./componentBindings";

export default function CreatePropertyBinding({ component, open, setOpen }) {
  const { properties } = useContext(ScenarioContext);
  const [target, setTarget] = useState(null);
  const [selectedProperty, setSelectedProperty] = useState(null);

  const availableTargets = useMemo(() => {
    const boundTargets = new Set(
      component?.stateBindings?.map((binding) => binding.target) ?? []
    );
    return getComponentBindingTargets(component).filter(
      (candidate) => !boundTargets.has(candidate.key)
    );
  }, [component]);

  const compatibleProperties = target
    ? (properties ?? []).filter(
        (property) => property.type === target.propertyType
      )
    : [];
  const targetAlreadyBound =
    component?.stateBindings?.some(
      (binding) => binding.target === target?.key
    ) ?? false;

  function selectTarget(nextTarget) {
    setTarget(nextTarget);
    setSelectedProperty(null);
  }

  function close() {
    setTarget(null);
    setSelectedProperty(null);
    setOpen(false);
  }

  function create() {
    if (!target || !selectedProperty) return;

    modifyComponentProp([component.id], "stateBindings", (bindings) => {
      if (bindings?.some((binding) => binding.target === target.key)) {
        return bindings;
      }

      return [
        ...(bindings ?? []),
        {
          target: target.key,
          stateVariableId: selectedProperty.id,
        },
      ];
    });
    close();
  }

  return (
    <ModalDialog title="Create Property Binding" open={open} onClose={close}>
      {!properties?.length ? (
        <div className="text-s">
          No properties found for this scenario. Create one from the
          &apos;Properties&apos; menu in the toolbar first.
        </div>
      ) : !availableTargets.length ? (
        <div className="text-s">
          Every supported property on this component already has a binding.
        </div>
      ) : (
        <fieldset className="fieldset">
          <label className="label">Component Property</label>
          <SelectInput
            values={availableTargets}
            value={target}
            display={(candidate) =>
              `${candidate.label} (${candidate.propertyType})`
            }
            onChange={selectTarget}
          />

          {target && (
            <>
              <label className="label">Property</label>
              {compatibleProperties.length ? (
                <SelectInput
                  values={compatibleProperties}
                  value={selectedProperty}
                  display={(property) => property.name}
                  onChange={setSelectedProperty}
                />
              ) : (
                <div className="text-s text-warning">
                  Create a {target.propertyType} property to bind this component
                  property.
                </div>
              )}
            </>
          )}
        </fieldset>
      )}

      <div className="modal-action">
        <button
          className={`btn ${
            (!target || !selectedProperty || targetAlreadyBound) &&
            "btn-disabled"
          }`}
          onClick={create}
          disabled={!target || !selectedProperty || targetAlreadyBound}
        >
          Create
        </button>
      </div>
    </ModalDialog>
  );
}
