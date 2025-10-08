import {
  BringToFront,
  Redo2Icon,
  SendToBack,
  Type,
  Undo2Icon,
} from "lucide-react";
import ShapeSection from "./ShapeSection";
import TextSection from "./TextSection";
import useEditorStore from "../stores/editor";
import { getComponent } from "../scene/scene";
import { redo, undo } from "../scene/history";
import { bringToFront, sendToBack } from "../scene/operations/component";
import { useState } from "react";
import StateVariableMenu from "../../../components/StateVariables/StateVariableMenu";
import ImageCreateMenu from "../images";
import ShapeCreateMenu from "./ShapeCreateMenu";

function Topbar({ saving, save }: { saving: boolean, save: () => void }) {
  const selected = useEditorStore(state => state.selected);
  const setMode = useEditorStore(state => state.setMode);
  const setCreateType = useEditorStore(state => state.setCreateType);

  const [showSVMenu, setShowSVMenu] = useState(false);

  function toggleSVMenu() {
    setShowSVMenu(prev => !prev);
  }

  const switchCreate = (type: string) => {
    setMode(["create"]);
    setCreateType(type);
  };

  const component = selected ? getComponent(selected) : null;

  return <>
    <StateVariableMenu show={showSVMenu} setShow={setShowSVMenu} />
    <ul className="topbar gap-0.5 menu menu-horizontal w-full bg-base-300 rounded-box p-1" >
      <li className="text-xs"><a onClick={toggleSVMenu}>State Variables</a></li>

      <div className="divider divider-horizontal" />

      <li><a onClick={undo}><Undo2Icon size={16} /></a></li>
      <li><a onClick={redo}><Redo2Icon size={16} /></a></li>

      <div className="divider divider-horizontal" />

      {/* element creation */}
      <ImageCreateMenu />
      <li><a onClick={() => switchCreate("textbox")}><Type size={16} /></a></li>
      <ShapeCreateMenu />

      {/* element properties */}
      {selected && (
        <>
          <div className="divider divider-horizontal" />

          {/* reorder */}
          <li><a onClick={() => bringToFront(selected)}><BringToFront size={16} /></a></li>
          <li><a onClick={() => sendToBack(selected)}><SendToBack size={16} /></a></li>

          {/* shape properties */}
          {component.type !== "image" && <>
            <div className="divider divider-horizontal" />
            <ShapeSection />
          </>}

          {/* text content styles */}
          {component.type === "textbox" && <>
            <div className="divider divider-horizontal" />
            <TextSection />
          </>}
        </>
      )}
      <li className={`ml-auto text-xs ${saving && "menu-disabled"}`}><a onClick={save}>{saving ? "Saving" : "Save"}</a></li>
    </ul>
  </>;
}

export default Topbar;
