import SceneContext from "context/SceneContext";
import { Info } from "lucide-react";

import { useContext, useEffect, useMemo, useState } from "react";
import { modifyComponentProp } from "../scene/operations/component";
import useVisualScene from "../stores/visual";
import SelectInput from "../components/Select";
import KeyCapture from "../components/KeyCapture";
import { availableKeyBindings, hasClickAction } from "../keyBindings";
import {
  KEY_HINT_POSITIONS,
  DEFAULT_KEY_HINT_POSITION,
  displayKeyHintPosition,
} from "../keyHintPosition";

const orNull = (v) => v ?? null;
const toBoolean = (v) => !!v;
const orDefaultPosition = (v) => v ?? DEFAULT_KEY_HINT_POSITION;

// Mirrors a component prop field into local editable state so edits survive
// re-renders, resyncing only when the field's value actually changes on the
// incoming component (preserves in-flight local edits otherwise).
function usePropMirror(component, field, normalize) {
  const [value, setValue] = useState(() => normalize(component?.[field]));
  useEffect(() => {
    setValue(normalize(component?.[field]));
  }, [component, field, normalize]);
  return [value, setValue];
}

/**
 * The key binding section of the "Button Actions" panel: lets the player
 * trigger a clickable component by pressing a key.
 * @component
 */
export default function KeyBindingSettings({ component }) {
  const { scenes } = useContext(SceneContext);

  // Subscribed (not read via a one-off getScene() call) so this panel
  // re-renders - and its available-keys list stays current - when another
  // component or the scene's direct link claims/frees a key elsewhere.
  const sceneComponents = useVisualScene((scene) => scene.components);
  const directLink = useVisualScene((scene) => scene.directLink);
  const directLinkKey = useVisualScene((scene) => scene.directLinkKey);

  const [keyValue, setKeyValue] = usePropMirror(
    component,
    "keyBinding",
    orNull
  );
  const [hintValue, setHintValue] = usePropMirror(
    component,
    "showKeyHint",
    toBoolean
  );
  const [positionValue, setPositionValue] = usePropMirror(
    component,
    "keyHintPosition",
    orDefaultPosition
  );

  function saveKey(v) {
    setKeyValue(v);
    modifyComponentProp([component.id], "keyBinding", v);
    if (!v && hintValue) {
      setHintValue(false);
      modifyComponentProp([component.id], "showKeyHint", false);
    }
  }

  function saveHint(checked) {
    setHintValue(checked);
    modifyComponentProp([component.id], "showKeyHint", checked);
  }

  function savePosition(v) {
    setPositionValue(v);
    modifyComponentProp([component.id], "keyHintPosition", v);
  }

  const availableKeys = useMemo(
    () =>
      component?.clickable
        ? availableKeyBindings(Object.values(sceneComponents ?? {}), {
            excludeComponentId: component.id,
            directLink,
            directLinkKey,
          })
        : [],
    [component, sceneComponents, directLink, directLinkKey]
  );

  // A Next Scene that no longer exists (its scene was deleted elsewhere)
  // shouldn't linger as a dangling id - null it out the moment it's
  // noticed, so Linked Scene reads "None" instead of a blank scene name.
  // A key binding with nothing to trigger (no Next Scene and no Property
  // Operations) is a dead binding - clear that too, whether it's this
  // cleanup or an edit that removed its last action. Mirrors the cleanup
  // pattern in useDirectLink.js.
  useEffect(() => {
    if (!component?.clickable) return;

    const linksToMissingScene =
      component.nextScene != null &&
      !scenes?.some((s) => s._id === component.nextScene);

    if (linksToMissingScene) {
      modifyComponentProp([component.id], "nextScene", null);
    }

    const stillActionable = hasClickAction({
      ...component,
      nextScene: linksToMissingScene ? null : component.nextScene,
    });

    if (!stillActionable) {
      if (component.keyBinding) {
        modifyComponentProp([component.id], "keyBinding", null);
      }
      if (component.showKeyHint) {
        modifyComponentProp([component.id], "showKeyHint", false);
      }
    }
  }, [component, scenes]);

  if (!component?.clickable) return null;

  const canBindKey = hasClickAction(component);

  return (
    <fieldset className="fieldset pt-2">
      <label className="label">Key Binding</label>
      <div className="flex items-center gap-2">
        <KeyCapture
          value={keyValue}
          availableKeys={availableKeys}
          onChange={saveKey}
          disabled={!canBindKey}
        />
        <span
          className="text-base-content/60 tooltip tooltip-top cursor-help before:!whitespace-normal before:!max-w-[180px] before:!text-[0.75rem]"
          data-tip="Lets the player trigger this element by pressing a key instead of clicking - fires the Linked Scene and/or the Property Operations, whichever are set."
        >
          <Info size={16} />
        </span>
      </div>
      {!canBindKey && (
        <span className="text-xs text-base-content/60">
          Set a Linked Scene or a Property Operation before binding a key.
        </span>
      )}
      <label className="label cursor-pointer justify-start gap-3 mt-2 mb-2">
        <input
          type="checkbox"
          className="toggle"
          checked={hintValue}
          disabled={!keyValue || !canBindKey}
          onChange={(e) => saveHint(e.target.checked)}
        />
        Show key hint
      </label>
      {hintValue && (
        <>
          <label className="label">Key Hint Position</label>
          <SelectInput
            values={KEY_HINT_POSITIONS}
            value={positionValue}
            onChange={savePosition}
            display={displayKeyHintPosition}
          />
        </>
      )}
    </fieldset>
  );
}
