import { useEffect, useMemo } from "react";
import { Info } from "lucide-react";
import { modifyComponentProp } from "../scene/operations/component";
import useVisualScene from "../stores/visual";
import useField from "../inputs/useField";
import SelectInput from "../components/Select";
import KeyCapture from "../components/KeyCapture";
import PanelInput from "./PanelInput";
import {
  availableKeyBindings,
  hasClickAction,
  hasDefaultTrigger,
} from "../keyBindings";
import {
  KEY_HINT_POSITIONS,
  DEFAULT_KEY_HINT_POSITION,
  displayKeyHintPosition,
  type KeyHintPosition,
} from "../keyHintPosition";
import type { Component } from "../types";

interface KeyBindingInputProps {
  component: Component;
}

/**
 * The key binding inputs of the "Button Link" section.
 * @component
 */
function KeyBindingInput({ component }: KeyBindingInputProps) {
  const { id } = component;

  const sceneComponents = useVisualScene((scene) => scene.components);
  const defaultLinkedScene = useVisualScene(
    (scene) => scene.defaultLinkedScene
  );
  const defaultActionRefs = useVisualScene((scene) => scene.defaultActionRefs);
  const defaultKeyBinding = useVisualScene((scene) => scene.defaultKeyBinding);

  const keyField = useField<string | null>("keyBinding", {
    empty: null,
    commit: "onChange",
    component: id,
  });
  const hintField = useField<boolean>("showKeyHint", {
    empty: false,
    commit: "onChange",
    component: id,
  });
  const positionField = useField<KeyHintPosition>("keyHintPosition", {
    empty: DEFAULT_KEY_HINT_POSITION,
    commit: "onChange",
    component: id,
  });

  const canBindKey = hasClickAction(component);

  const availableKeys = useMemo(
    () =>
      availableKeyBindings(Object.values(sceneComponents), {
        excludeComponentId: id,
        hasDefaultTrigger: hasDefaultTrigger({
          defaultLinkedScene,
          defaultActionRefs,
        }),
        defaultKeyBinding,
      }),
    [
      id,
      sceneComponents,
      defaultLinkedScene,
      defaultActionRefs,
      defaultKeyBinding,
    ]
  );

  useEffect(() => {
    if (canBindKey) return;
    if (component.keyBinding) modifyComponentProp([id], "keyBinding", null);
    if (component.showKeyHint) modifyComponentProp([id], "showKeyHint", false);
  }, [canBindKey, component.keyBinding, component.showKeyHint, id]);

  function saveKey(key: string | null) {
    keyField.props.onChange(key);
    if (!key && hintField.props.value) hintField.props.onChange(false);
  }

  if (!canBindKey) return null;

  return (
    <>
      <PanelInput label="Key Binding">
        <div className="flex items-center gap-2">
          <KeyCapture
            value={keyField.props.value}
            availableKeys={availableKeys}
            onChange={saveKey}
          />
          <span
            className="text-base-content/60 tooltip tooltip-top cursor-help before:!whitespace-normal before:!max-w-[180px] before:!text-[0.75rem]"
            data-tip="Lets the player trigger this element by pressing a key instead of clicking - runs the Linked Scene and Actions, whichever are set."
          >
            <Info size={16} />
          </span>
        </div>
      </PanelInput>
      <label className="label cursor-pointer justify-start gap-3 text-xs">
        <input
          type="checkbox"
          className="toggle toggle-sm"
          checked={hintField.props.value}
          disabled={!keyField.props.value}
          onChange={(e) => hintField.props.onChange(e.target.checked)}
        />
        Show key hint
      </label>
      {hintField.props.value && (
        <PanelInput label="Key Hint Position">
          <SelectInput
            values={[...KEY_HINT_POSITIONS]}
            value={positionField.props.value}
            onChange={(v) => positionField.props.onChange(v)}
            display={displayKeyHintPosition}
          />
        </PanelInput>
      )}
    </>
  );
}

export default KeyBindingInput;
