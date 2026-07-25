import { useContext, useMemo, useState } from "react";
import { PlusIcon } from "lucide-react";
import ScenarioContext from "../../context/ScenarioContext";
import { modifyComponentProp } from "../../features/authoring/scene/operations/component";
import SelectInput from "../../features/authoring/components/Select";
import ModalDialog from "../ModalDialogue";
import { getComponentBindingTargets } from "./componentBindings";

function CreateStateBinding({ component, open, setOpen }) {
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

function StateBinding({ component, binding }) {
  const { stateVariables } = useContext(ScenarioContext);
  const target = getComponentBindingTargets(component).find(
    (candidate) => candidate.key === binding.target
  );
  const stateVariable = stateVariables?.find(
    (variable) => variable.id === binding.stateVariableId
  );
  const valid = target && stateVariable?.type === target.stateType;

  function remove() {
    modifyComponentProp(
      component.id,
      "stateBindings",
      component.stateBindings.filter((candidate) => candidate !== binding)
    );
  }

  return (
    <div className="bg-base-300 mt-xs px-[1rem] py-[0.5rem]">
      <div className="flex items-center gap-xs">
        <div className="min-w-0">
          <div className="text--1">{target?.label ?? binding.target}</div>
          <div
            className={`text-xs break-words ${
              valid ? "text-primary" : "text-warning"
            }`}
          >
            {stateVariable
              ? `${stateVariable.name} (${stateVariable.type})`
              : "State variable no longer exists"}
          </div>
        </div>
        <button className="btn btn-xs btn-phantom ml-auto" onClick={remove}>
          Delete
        </button>
      </div>
    </div>
  );
}

export default function StateBindingMenu({ component }) {
  const [createOpen, setCreateOpen] = useState(false);
  const bindings = component?.stateBindings ?? [];

  return (
    <>
      <div className="collapse overflow-visible collapse-arrow bg-base-300 rounded-sm text-s">
        <input type="checkbox" />
        <div className="collapse-title flex items-center justify-between">
          State Bindings
          <PlusIcon
            size={18}
            className="z-1"
            onClick={(event) => {
              event.stopPropagation();
              setCreateOpen(true);
            }}
          />
        </div>
        <div className="collapse-content text--1 bg-base-200 px-0">
          {bindings.length ? (
            bindings.map((binding, index) => (
              <StateBinding
                component={component}
                binding={binding}
                key={`${binding.target}-${binding.stateVariableId}-${index}`}
              />
            ))
          ) : (
            <div className="px-[1rem] py-[0.5rem] text-xs">
              No properties are bound.
            </div>
          )}
        </div>
      </div>
      <CreateStateBinding
        component={component}
        open={createOpen}
        setOpen={setCreateOpen}
      />
    </>
  );
}
