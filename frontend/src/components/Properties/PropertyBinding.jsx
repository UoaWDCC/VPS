import { useContext } from "react";
import ScenarioContext from "../../context/ScenarioContext";
import { modifyComponentProp } from "../../features/authoring/scene/operations/component";
import { getComponentBindingTargets } from "./componentBindings";

export default function PropertyBinding({ component, binding }) {
  const { properties } = useContext(ScenarioContext);
  const target = getComponentBindingTargets(component).find(
    (candidate) => candidate.key === binding.target
  );
  const property = properties?.find(
    (candidate) => candidate.id === binding.stateVariableId
  );
  const valid = target && property?.type === target.propertyType;

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
            {property
              ? `${property.name} (${property.type})`
              : "Property no longer exists"}
          </div>
        </div>
        <button className="btn btn-xs btn-phantom ml-auto" onClick={remove}>
          Delete
        </button>
      </div>
    </div>
  );
}
