import SceneContext from "context/SceneContext";

import { useContext, useEffect, useState } from "react";
import { modifyComponentProp } from "../scene/operations/component";
import { getScene } from "../scene/scene";
import StateOperationMenu from "../../../components/StateVariables/StateOperationMenu";
import SelectInput from "../components/Select";
import KeyCapture from "../components/KeyCapture";
import StateBindingMenu from "../../../components/StateVariables/StateBindingMenu";
import { KEY_BINDING_OPTIONS, directLinkKeysFor } from "../keyBindings";

/**
 * This component displays the properties the selected scene component
 * @component
 */
export default function ComponentProperties({ component }) {
  const { scenes } = useContext(SceneContext);

  const [value, setValue] = useState(component?.nextScene);
  const [keyValue, setKeyValue] = useState(component?.keyBinding ?? null);
  const [hintValue, setHintValue] = useState(!!component?.showKeyHint);

  useEffect(() => {
    if (component?.nextScene !== value) setValue(component?.nextScene);
    if ((component?.keyBinding ?? null) !== keyValue)
      setKeyValue(component?.keyBinding ?? null);
    if (!!component?.showKeyHint !== hintValue)
      setHintValue(!!component?.showKeyHint);
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

  if (!component) return null;

  const scene = getScene();
  const usedKeys = component.clickable
    ? [
        ...Object.values(scene.components)
          .filter((c) => c.id !== component.id && c.clickable && c.keyBinding)
          .map((c) => c.keyBinding),
        ...(scene.directLink ? directLinkKeysFor(scene.directLinkKey) : []),
      ]
    : [];
  const availableKeys = KEY_BINDING_OPTIONS.filter(
    (k) => !usedKeys.includes(k)
  );

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
            </div>
          </div>
          <StateOperationMenu component={component} />
        </>
      )}
    </>
  );
}
