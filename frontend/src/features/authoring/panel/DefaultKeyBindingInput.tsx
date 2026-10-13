import { useEffect, useMemo } from "react";
import useVisualScene from "../stores/visual";
import { modifySceneProp } from "../scene/operations/modifiers";
import { modifyComponentProp } from "../scene/operations/component";
import { getScene } from "../scene/scene";
import SelectInput from "../components/Select";
import KeyCapture from "../components/KeyCapture";
import PanelInput from "./PanelInput";
import {
  availableKeyBindings,
  DEFAULT_TRIGGER_KEYS,
  hasDefaultTrigger,
} from "../keyBindings";

type KeyMode = "DEFAULT" | "CUSTOM";

function clearDefaultKeyCollisions() {
  const collidingIds = Object.values(getScene().components)
    .filter(
      (c) =>
        c.clickable &&
        c.keyBinding &&
        DEFAULT_TRIGGER_KEYS.includes(c.keyBinding)
    )
    .map((c) => c.id);
  if (!collidingIds.length) return;
  modifyComponentProp(collidingIds, "keyBinding", null);
  modifyComponentProp(collidingIds, "showKeyHint", false);
}

/**
 * The key binding inputs of the "Scene Link" section.
 * @component
 */
function DefaultKeyBindingInput() {
  const components = useVisualScene((scene) => scene.components);
  const defaultLinkedScene = useVisualScene(
    (scene) => scene.defaultLinkedScene
  );
  const defaultActionRefs = useVisualScene((scene) => scene.defaultActionRefs);
  const defaultKeyBinding = useVisualScene((scene) => scene.defaultKeyBinding);

  const active = hasDefaultTrigger({ defaultLinkedScene, defaultActionRefs });
  const keyMode: KeyMode = defaultKeyBinding != null ? "CUSTOM" : "DEFAULT";

  const availableKeys = useMemo(
    () => availableKeyBindings(Object.values(components)),
    [components]
  );

  useEffect(() => {
    if (active && defaultKeyBinding == null) clearDefaultKeyCollisions();
  }, [active, defaultKeyBinding]);

  function changeKeyMode(mode: KeyMode) {
    // "" = custom with no key picked yet (null means the default keys)
    modifySceneProp("defaultKeyBinding", mode === "DEFAULT" ? null : "");
  }

  if (!active) return null;

  return (
    <PanelInput label="Key Binding">
      <SelectInput<KeyMode>
        value={keyMode}
        values={["DEFAULT", "CUSTOM"]}
        display={(v) => (v === "DEFAULT" ? "Default (Space or →)" : "Custom")}
        onChange={changeKeyMode}
      />
      {keyMode === "CUSTOM" && (
        <div className="mt-2">
          <KeyCapture
            value={defaultKeyBinding}
            availableKeys={availableKeys}
            onChange={(key: string | null) =>
              modifySceneProp("defaultKeyBinding", key)
            }
            clearValue=""
          />
          {!defaultKeyBinding && (
            <p className="text-warning text-xs mt-1">
              ⚠ No key set - the player will have no way to trigger the scene
              link until you pick one.
            </p>
          )}
        </div>
      )}
    </PanelInput>
  );
}

export default DefaultKeyBindingInput;
