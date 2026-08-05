import SceneContext from "context/SceneContext";

import { useContext, useEffect, useState } from "react";
import { modifyComponentProp } from "../scene/operations/component";
import StateOperationMenu from "../../../components/StateVariables/StateOperationMenu";
import SelectInput from "../components/Select";
import StateBindingMenu from "../../../components/StateVariables/StateBindingMenu";

/**
 * This component displays the properties the selected scene component
 * @component
 */
export default function ComponentProperties({ component }) {
  const { scenes } = useContext(SceneContext);

  const [value, setValue] = useState(component?.nextScene);

  useEffect(() => {
    if (component?.nextScene !== value) setValue(component?.nextScene);
  }, [component]);

  function saveLink(v) {
    setValue(v);
    modifyComponentProp(component.id, "nextScene", v);
  }

  if (!component) return null;

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
            </div>
          </div>
          <StateOperationMenu component={component} />
        </>
      )}
    </>
  );
}
