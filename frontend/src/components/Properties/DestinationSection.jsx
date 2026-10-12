import { useContext, useEffect, useState } from "react";
import { PlusIcon } from "lucide-react";
import SceneContext from "../../context/SceneContext";
import SelectInput from "../../features/authoring/components/Select";
import { modifyComponentProp } from "../../features/authoring/scene/operations/component";
import CreateDestinationRule from "./CreateDestinationRule";
import EditDestinationRule from "./EditDestinationRule";

/**
 * Where a button leads: a scene, or a list of rules that pick the scene from
 * the player's properties. The rules are checked in order after the button's
 * own property operations, and the scene below them is used when none match.
 *
 * @component
 */
const DestinationSection = ({ component }) => {
  const { scenes } = useContext(SceneContext);
  const [createOpen, setCreateOpen] = useState(false);

  const rules = component?.nextSceneRules ?? [];
  const [fallback, setFallback] = useState(component?.nextScene);

  useEffect(() => {
    if (component?.nextScene !== fallback) setFallback(component?.nextScene);
  }, [component]);

  function saveFallback(v) {
    if (!component) return;
    setFallback(v);
    modifyComponentProp([component.id], "nextScene", v);
  }

  return (
    <>
      <fieldset className="fieldset pt-2">
        <label className="label">
          {rules.length ? "Otherwise go to" : "Linked Scene"}
        </label>
        <SelectInput
          nullable
          values={scenes?.map((s) => s._id) ?? []}
          value={fallback}
          onChange={saveFallback}
          display={(v) =>
            scenes.find((s) => s._id === v)?.name ?? "Missing scene"
          }
        />
      </fieldset>

      {rules.length > 0 && (
        <div className="mb-3 text--1">
          <p className="text-xs opacity-70">
            Rules are checked from the top, after this button&apos;s operations.
            The first one that matches decides where the player goes.
          </p>
          {rules.map((rule, i) => (
            <EditDestinationRule
              component={component}
              ruleIndex={i}
              rule={rule}
              key={i}
            />
          ))}
        </div>
      )}

      <div className="mb-3">
        <button
          type="button"
          className="flex w-full items-center gap-2 rounded-sm border-0 bg-base-300 px-3 py-2 text-left text-sm shadow-none transition-colors hover:bg-base-100"
          onClick={() => setCreateOpen(true)}
        >
          <PlusIcon size={16} />
          Add Destination Rule
        </button>
      </div>

      <CreateDestinationRule
        component={component}
        open={createOpen}
        setOpen={setCreateOpen}
      />
    </>
  );
};

export default DestinationSection;
