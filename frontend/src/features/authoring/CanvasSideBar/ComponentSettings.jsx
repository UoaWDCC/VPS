import SceneContext from "context/SceneContext";

import { useContext, useEffect, useState } from "react";
import { modifyComponentProp } from "../scene/operations/component";
import PropertyOperationMenu from "../../../components/Properties/PropertyOperationMenu";
import SelectInput from "../components/Select";
import PropertyBindingMenu from "../../../components/Properties/PropertyBindingMenu";
import SidePanel from "./SidePanel";
import { LinkIcon } from "lucide-react";
import { ObjectPropertyEditor } from "./ObjectPropertyEditor";

/**
 * This component displays the properties the selected scene component
 * @component
 */
export default function ComponentSettings({
  component,
  activePanel,
  onTogglePanel,
}) {
  const { scenes } = useContext(SceneContext);

  const [value, setValue] = useState(component?.nextScene);

  useEffect(() => {
    if (component?.nextScene !== value) setValue(component?.nextScene);
  }, [component]);

  function saveLink(v) {
    setValue(v);
    modifyComponentProp([component.id], "nextScene", v);
  }

  if (!component) return null;

  return (
    <>
      <PropertyBindingMenu
        component={component}
        open={activePanel === "bindings"}
        onToggle={() => onTogglePanel("bindings")}
      />
      {component.clickable && (
        <>
          <SidePanel
            label="Link Details"
            Icon={LinkIcon}
            open={activePanel === "link"}
            onToggle={() => onTogglePanel("link")}
          >
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
          </SidePanel>
          <PropertyOperationMenu
            component={component}
            open={activePanel === "operations"}
            onToggle={() => onTogglePanel("operations")}
          />
        </>
      )}
      <ObjectPropertyEditor
        component={component}
        open={activePanel === "object-properties"}
        onToggle={() => onTogglePanel("object-properties")}
      />
    </>
  );
}
