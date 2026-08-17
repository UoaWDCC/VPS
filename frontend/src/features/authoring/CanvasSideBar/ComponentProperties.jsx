import SceneContext from "context/SceneContext";

import { useContext, useEffect, useState } from "react";
import { modifyComponentProp } from "../scene/operations/component";
import useVisualScene from "../stores/visual";
import StateOperationMenu from "../../../components/StateVariables/StateOperationMenu";
import SelectInput from "../components/Select";
import KeyCapture from "../components/KeyCapture";
import StateBindingMenu from "../../../components/StateVariables/StateBindingMenu";
import { availableKeyBindings } from "../keyBindings";
import {
  KEY_HINT_POSITIONS,
  DEFAULT_KEY_HINT_POSITION,
  displayKeyHintPosition,
} from "../keyHintPosition";

/**
 * This component displays the properties the selected scene component
 * @component
 */
export default function ComponentProperties({ component }) {
  const { scenes } = useContext(SceneContext);

  // Subscribed (not read via a one-off getScene() call) so this panel
  // re-renders - and its available-keys list stays current - when another
  // component or the scene's direct link claims/frees a key elsewhere.
  const sceneComponents = useVisualScene((scene) => scene.components);
  const directLink = useVisualScene((scene) => scene.directLink);
  const directLinkKey = useVisualScene((scene) => scene.directLinkKey);

  const [value, setValue] = useState(component?.nextScene);
  const [keyValue, setKeyValue] = useState(component?.keyBinding ?? null);
  const [hintValue, setHintValue] = useState(!!component?.showKeyHint);
  const [positionValue, setPositionValue] = useState(
    component?.keyHintPosition ?? DEFAULT_KEY_HINT_POSITION
  );

  useEffect(() => {
    if (component?.nextScene !== value) setValue(component?.nextScene);
    if ((component?.keyBinding ?? null) !== keyValue)
      setKeyValue(component?.keyBinding ?? null);
    if (!!component?.showKeyHint !== hintValue)
      setHintValue(!!component?.showKeyHint);
    const nextPosition = component?.keyHintPosition ?? DEFAULT_KEY_HINT_POSITION;
    if (nextPosition !== positionValue) setPositionValue(nextPosition);
  }, [component]);

  function saveLink(v) {
    setValue(v);
    modifyComponentProp(component.id, "nextScene", v);
  }

  function saveKey(v) {
    setKeyValue(v);
    modifyComponentProp(component.id, "keyBinding", v);
    if (!v && hintValue) {
      setHintValue(false);
      modifyComponentProp(component.id, "showKeyHint", false);
    }
  }

  function saveHint(checked) {
    setHintValue(checked);
    modifyComponentProp(component.id, "showKeyHint", checked);
  }

  function savePosition(v) {
    setPositionValue(v);
    modifyComponentProp(component.id, "keyHintPosition", v);
  }

  if (!component) return null;

  const availableKeys = component.clickable
    ? availableKeyBindings(Object.values(sceneComponents ?? {}), {
        excludeComponentId: component.id,
        directLink,
        directLinkKey,
      })
    : [];

  return (
    <>
      <StateBindingMenu component={component} />
      {component.clickable && (
        <>
          <div className="collapse overflow-visible collapse-arrow bg-base-300 rounded-sm text-s">
            <input type="checkbox" />
            <div className="collapse-title">Link Details</div>
            <div className="collapse-content text--1 bg-base-200">
              <fieldset className="fieldset pt-2">
                <label className="label">Next Scene</label>
                <SelectInput
                  nullable
                  values={scenes.map((s) => s._id)}
                  value={value}
                  onChange={saveLink}
                  display={(v) => scenes.find((s) => s._id === v)?.name}
                />
              </fieldset>
              <fieldset className="fieldset pt-2">
                <label className="label">Key Binding</label>
                <KeyCapture
                  value={keyValue}
                  availableKeys={availableKeys}
                  onChange={saveKey}
                />
              </fieldset>
              <label className="label cursor-pointer justify-start gap-3 mt-2 mb-2">
                <input
                  type="checkbox"
                  className="toggle"
                  checked={hintValue}
                  disabled={!keyValue}
                  onChange={(e) => saveHint(e.target.checked)}
                />
                Show key hint
              </label>
              {hintValue && (
                <fieldset className="fieldset pt-2">
                  <label className="label">Key Hint Position</label>
                  <SelectInput
                    values={KEY_HINT_POSITIONS}
                    value={positionValue}
                    onChange={savePosition}
                    display={displayKeyHintPosition}
                  />
                </fieldset>
              )}
            </div>
          </div>
          <StateOperationMenu component={component} />
        </>
      )}
    </>
  );
}
