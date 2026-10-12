import { useContext, useEffect, useState } from "react";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import SceneContext from "../../context/SceneContext";
import ScenarioContext from "../../context/ScenarioContext";
import SelectInput from "../../features/authoring/components/Select";
import { modifyComponentProp } from "../../features/authoring/scene/operations/component";
import RuleValue from "./RuleValue";
import { propertyTypes, validComparators } from "./propertyTypes";

const TYPE_LABELS = {
  string: "Text",
  number: "Number",
  boolean: "True/False",
};

/**
 * One destination rule on a button: the condition, where it leads, and
 * buttons to reorder or delete it. The rules are checked from the top, so the
 * order is part of what the rule means.
 *
 * @component
 */
const EditDestinationRule = ({ component, ruleIndex, rule }) => {
  const { properties } = useContext(ScenarioContext);
  const { scenes } = useContext(SceneContext);

  const [value, setValue] = useState(rule.value);

  useEffect(() => {
    if (rule.value !== value) setValue(rule.value);
  }, [rule]);

  const rules = component.nextSceneRules;
  const property = properties?.find((p) => p.id === rule.stateVariableId);

  const save = (key, v) =>
    modifyComponentProp(
      [component.id],
      `nextSceneRules.${ruleIndex}.${key}`,
      v
    );

  const saveValue = (v) => {
    if (property?.type !== propertyTypes.NUMBER) return save("value", v);
    // a number that isn't one yet goes back to what was saved
    if (v === "" || Number.isNaN(Number(v))) return setValue(rule.value);
    save("value", Number(v));
  };

  const remove = () =>
    modifyComponentProp(
      [component.id],
      "nextSceneRules",
      rules.toSpliced(ruleIndex, 1)
    );

  const move = (by) => {
    const reordered = [...rules];
    [reordered[ruleIndex], reordered[ruleIndex + by]] = [
      reordered[ruleIndex + by],
      reordered[ruleIndex],
    ];
    modifyComponentProp([component.id], "nextSceneRules", reordered);
  };

  const buttons = (
    <span className="float-right flex items-center">
      <button
        type="button"
        className="btn btn-xs btn-phantom btn-square"
        title="Check this rule earlier"
        disabled={ruleIndex === 0}
        onClick={() => move(-1)}
      >
        <ArrowUpIcon size={14} />
      </button>
      <button
        type="button"
        className="btn btn-xs btn-phantom btn-square"
        title="Check this rule later"
        disabled={ruleIndex === rules.length - 1}
        onClick={() => move(1)}
      >
        <ArrowDownIcon size={14} />
      </button>
      <button type="button" className="btn btn-xs btn-phantom" onClick={remove}>
        Delete
      </button>
    </span>
  );

  if (!property) {
    return (
      <div className="bg-base-300 mt-xs px-[1rem] py-[0.5rem]">
        <div>
          <span className="text--1 text-error">
            This rule uses a property that was deleted
          </span>
          {buttons}
        </div>
        <p className="text-xs opacity-70">
          It never matches. Delete it, or create the rule again.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-base-300 mt-xs px-[1rem] py-[0.5rem]">
      <div>
        <span className="text--1">If {property.name}</span>
        <span className="text-xs ml-2xs text-primary">
          {TYPE_LABELS[property.type] ?? property.type}
        </span>
        {buttons}
      </div>

      <fieldset className="fieldset mt-[0.5rem]">
        <div className="join">
          <SelectInput
            values={validComparators[property.type]}
            value={rule.comparator}
            onChange={(v) => save("comparator", v)}
          />
          <RuleValue
            type={property.type}
            value={value}
            onChange={setValue}
            onCommit={saveValue}
          />
        </div>
        <label className="label">Go to</label>
        <SelectInput
          values={scenes?.map((s) => s._id) ?? []}
          value={rule.sceneId}
          display={(id) =>
            scenes.find((s) => s._id === id)?.name ?? "Missing scene"
          }
          onChange={(v) => save("sceneId", v)}
        />
      </fieldset>
    </div>
  );
};

export default EditDestinationRule;
