import { useContext } from "react";
import ScenarioContext from "../../context/ScenarioContext";
import { modifyComponentProp } from "../../features/authoring/scene/operations/component";
import { getComponentBindingTargets } from "./componentBindings";
import { XIcon } from "lucide-react";
import SelectInput from "../../features/authoring/components/Select";

export default function PropertyBinding({ component, binding }) {
  const { properties } = useContext(ScenarioContext);
  const target = getComponentBindingTargets(component).find(
    (candidate) => candidate.key === binding.target
  );
  const property = properties?.find(
    (candidate) => candidate.id === binding.stateVariableId
  );

  function remove() {
    modifyComponentProp(
      [component.id],
      "stateBindings",
      component.stateBindings.filter((candidate) => candidate !== binding)
    );
  }

  return (
    <li>
      <div className="flex gap-1 items-center">
        <div className="flex items-center join flex-1">
          <SelectInput
            values={properties}
            display={(p) => p.name}
            value={property ?? null}
            onChange={console.log}
            disabled={true}
          />
          <SelectInput
            values={["width", "height", "etc"]}
            value={target.label ?? null}
            onChange={console.log}
            disabled={true}
          />
        </div>
        <button className="btn btn-phantom btn-square btn-xs" onClick={remove}>
          <XIcon size={20} />
        </button>
      </div>
    </li>
  );
}
