
import SceneContext from "context/SceneContext";

import styles from "./CanvasSideBar.module.scss";
import useVisualScene from "../stores/visual";
import useEditorStore from "../stores/editor";
import { getComponent } from "../scene/scene";
import ButtonPropertiesComponent from "./ComponentProperties/ButtonPropertiesComponent";
import { useContext, useEffect, useState } from "react";
import { modifyComponentProp } from "../scene/operations/component";
import StateOperationMenu from "../../../components/StateVariables/StateOperationMenu";
import SelectInput from "../components/Select";

/**
 * This component displays the properties the selected scene component
 * @component
 */
export default function ComponentProperties({ component }) {
  const { scenes } = useContext(SceneContext);

  const [value, setValue] = useState(component?.nextScene);

  useEffect(() => {
    if (component?.nextScene !== value) setValue(component?.nextScene);
  }, [component])

  function saveLink(v) {
    setValue(v);
    modifyComponentProp(component.id, "nextScene", v);
  }

  if (!component?.clickable) return null;

  return (
    <>
      <div className="collapse overflow-visible collapse-arrow bg-base-300 rounded-sm text-s">
        <input type="checkbox" />
        <div className="collapse-title">Link Details</div>
        <div className="collapse-content text--1 bg-base-200">
          <fieldset className="fieldset pt-2">
            <label className="label">Next Scene</label>
            <SelectInput nullable values={scenes.map(s => s._id)} value={value} onChange={saveLink} display={(v) => scenes.find(s => s._id === v)?.name} />
          </fieldset>
        </div>
      </div>
      <StateOperationMenu component={component} />
    </>
  );
}
