import { useContext, useMemo, useState } from "react";
import ScenarioContext from "../../context/ScenarioContext";
import { modifyComponentProp } from "../../features/authoring/scene/operations/component";
import SelectInput from "../../features/authoring/components/Select";
import ModalDialog from "../ModalDialogue";
import { getComponentBindingTargets } from "./componentBindings";

export default function CreateStateBinding({ component, open, setOpen }) {
  const { stateVariables } = useContext(ScenarioContext);
  const [target, setTarget] = useState(null);
  const [stateVariable, setStateVariable] = useState(null);

  const availableTargets = useMemo(() => {
    const boundTargets = new Set(
      component?.stateBindings?.map((binding) => binding.target) ?? []
    );
    return getComponentBindingTargets(component).filter(
      (candidate) => !boundTargets.has(candidate.key)
    );
  }, [component]);

  const compatibleStateVariables = target
    ? (stateVariables ?? []).filter(
        (variable) => variable.type === target.stateType
      )
    : [];

  function selectTarget(nextTarget) {
    setTarget(nextTarget);
    setStateVariable(null);
  }

  function close() {
    setTarget(null);
    setStateVariable(null);
    setOpen(false);
  }

  function create() {
    if (!target || !stateVariable) return;

    modifyComponentProp(component.id, "stateBindings", (bindings) => [
      ...(bindings ?? []),
      {
        target: target.key,
        stateVariableId: stateVariable.id,
      },
    ]);
    close();
  }

  return (
    <ModalDialog title="Create State Binding" open={open} onClose={close}>
      {!stateVariables?.length ? (
        <div className="text-s">
          No state variables found for this scenario. Create one from the
          &apos;State Variables&apos; menu in the toolbar first.
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
              `${candidate.label} (${candidate.stateType})`
            }
            onChange={selectTarget}
          />

          {target && (
            <>
              <label className="label">State Variable</label>
              {compatibleStateVariables.length ? (
                <SelectInput
                  values={compatibleStateVariables}
                  value={stateVariable}
                  display={(variable) => variable.name}
                  onChange={setStateVariable}
                />
              ) : (
                <div className="text-s text-warning">
                  Create a {target.stateType} state variable to bind this
                  property.
                </div>
              )}
            </>
          )}
        </fieldset>
      )}

      <div className="modal-action">
        <button
          className={`btn ${(!target || !stateVariable) && "btn-disabled"}`}
          onClick={create}
        >
          Create
        </button>
      </div>
    </ModalDialog>
  );
}
