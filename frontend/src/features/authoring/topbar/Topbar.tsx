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

function Separator() {
  return <div className="topbar-separator" aria-hidden="true" />;
}

function Topbar({ saving, save }: { saving: boolean; save: () => void }) {
  const selected = useEditorStore((state) => state.selected);
  const setMode = useEditorStore((state) => state.setMode);
  const setCreateType = useEditorStore((state) => state.setCreateType);

  const [showSVMenu, setShowSVMenu] = useState(false);

  function toggleSVMenu() {
    setShowSVMenu((prev) => !prev);
  }

  const switchCreate = (type: string) => {
    setMode(["create"]);
    setCreateType(type);
  };

  const component = selected ? getComponent(selected) : null;

  return (
    <>
      <StateVariableMenu show={showSVMenu} setShow={setShowSVMenu} />
      <ul className="topbar menu w-full bg-base-300 rounded-box p-1">
        <li className="text-xs">
          <a onClick={toggleSVMenu}>State Variables</a>
        </li>

        <Separator />

        <li>
          <a onClick={undo}>
            <Undo2Icon size={16} />
          </a>
        </li>
        <li>
          <a onClick={redo}>
            <Redo2Icon size={16} />
          </a>
        </li>

        <Separator />

        {/* element creation */}
        <ImageCreateMenu />
        <li>
          <a onClick={() => switchCreate("textbox")}>
            <Type size={16} />
          </a>
        </li>
        <ShapeCreateMenu />

        {/* element properties */}
        {selected && (
          <>
            <Separator />

            {/* reorder */}
            <li>
              <a onClick={() => bringToFront(selected)}>
                <BringToFront size={16} />
              </a>
            </li>
            <li>
              <a onClick={() => sendToBack(selected)}>
                <SendToBack size={16} />
              </a>
            </li>

            {/* shape properties */}
            {component.type !== "image" && (
              <>
                <Separator />
                <ShapeSection />
              </>
            )}

            {/* text content styles */}
            {component.type === "textbox" && (
              <>
                <Separator />
                <TextSection />
              </>
            )}
          </>
        )}
        <li className={`ml-auto text-xs ${saving && "menu-disabled"}`}>
          <a onClick={save}>{saving ? "Saving" : "Save"}</a>
        </li>
      </ul>
    </>
  );
}

export default Topbar;
