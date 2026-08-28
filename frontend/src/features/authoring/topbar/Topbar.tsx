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
import { undo, redo } from "../scene/history";
import { bringToFront, sendToBack } from "../scene/operations/component";
import { useState } from "react";
import PropertyMenu from "../../../components/Properties/PropertyMenu";
import ImageCreateMenu from "../ImageCreateMenu";
import ShapeCreateMenu from "./ShapeCreateMenu";
import BackgroundMenu from "./BackgroundMenu";

import "./topbar.css";

function Topbar({ saving, save }: { saving: boolean; save: () => void }) {
  const selected = useEditorStore((state) => state.selected);
  const setMode = useEditorStore((state) => state.setMode);
  const setCreateType = useEditorStore((state) => state.setCreateType);

  const [showPropertyMenu, setShowPropertyMenu] = useState(false);
  const [showBackgroundMenu, setShowBackgroundMenu] = useState(false);

  function togglePropertyMenu() {
    setShowPropertyMenu((prev) => !prev);
  }

  const switchCreate = (type: string) => {
    setMode(["create"]);
    setCreateType(type);
  };

  const hasSelection = selected && selected.length > 0;

  // check the whole selection — a mixed selection can hide a section just
  // because a component of the "wrong" type happens to be first
  const selectedComponents = selected.map(getComponent);
  const hasShapeComponent = selectedComponents.some(
    (c) => c && c.type !== "image"
  );
  const hasTextboxComponent = selectedComponents.some(
    (c) => c?.type === "textbox"
  );

  return (
    <>
      <PropertyMenu show={showPropertyMenu} setShow={setShowPropertyMenu} />
      <BackgroundMenu
        show={showBackgroundMenu}
        setShow={setShowBackgroundMenu}
      />
      <ul className="topbar gap-0.5 menu menu-horizontal w-full bg-base-300 rounded-box p-1">
        <li className="text-xs">
          <button type="button" onClick={togglePropertyMenu}>
            Properties
          </button>
        </li>
        <li className="text-xs">
          <button
            type="button"
            className="p-1.5"
            onClick={() => setShowBackgroundMenu(true)}
          >
            Background
          </button>
        </li>

        <div className="divider divider-horizontal" />

        <li className="tooltip tooltip-bottom" data-tip="Undo">
          <button type="button" aria-label="Undo" onClick={() => undo()}>
            <Undo2Icon size={16} />
          </button>
        </li>
        <li className="tooltip tooltip-bottom" data-tip="Redo">
          <button type="button" aria-label="Redo" onClick={() => redo()}>
            <Redo2Icon size={16} />
          </button>
        </li>

        <div className="divider divider-horizontal" />

        {/* element creation */}
        <ImageCreateMenu />
        <li className="tooltip tooltip-bottom" data-tip="Add text">
          <a onClick={() => switchCreate("textbox")}>
            <Type size={16} />
          </a>
        </li>
        <ShapeCreateMenu />

        {/* element properties */}
        {hasSelection && (
          <>
            <div className="divider divider-horizontal" />
            {/* reorder */}
            <li className="tooltip tooltip-bottom" data-tip="Bring to front">
              <a onClick={() => bringToFront(selected)}>
                <BringToFront size={16} />
              </a>
            </li>
            <li className="tooltip tooltip-bottom" data-tip="Send to back">
              <a onClick={() => sendToBack(selected)}>
                <SendToBack size={16} />
              </a>
            </li>
            {/* shape properties */}
            {hasShapeComponent && (
              <>
                <div className="divider divider-horizontal" />
                <ShapeSection />
              </>
            )}

            {/* text content styles */}
            {hasTextboxComponent && (
              <>
                <div className="divider divider-horizontal" />
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
