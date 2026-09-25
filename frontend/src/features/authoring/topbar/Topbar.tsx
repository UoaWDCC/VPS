import { useState } from "react";
import { useHistory, useParams } from "react-router-dom";
import {
  BringToFront,
  FilesIcon,
  Redo2Icon,
  SendToBack,
  SlidersHorizontalIcon,
  Type,
  Undo2Icon,
} from "lucide-react";
import ShapeSection from "./ShapeSection";
import TextSection from "./TextSection";
import useEditorStore from "../stores/editor";
import { getComponent } from "../scene/scene";
import { undo, redo } from "../scene/history";
import { bringToFront, sendToBack } from "../scene/operations/component";
import ImageCreateMenu from "../ImageCreateMenu";
import ShapeCreateMenu from "./ShapeCreateMenu";
import type { Component } from "../types";
import BackgroundMenu from "../CanvasSideBar/BackgroundMenu";
import PropertyMenu from "../../../components/Properties/PropertyMenu";

import "./topbar.css";

function hasDocument(component: Component): boolean {
  if (!component) return false;
  if (!("document" in component)) return false;
  const doc = component.document as {
    blocks: { spans: { text: string }[] }[];
  } | null;
  const documentLength = doc?.blocks?.[0]?.spans?.[0]?.text?.length;
  return (
    "document" in component && Boolean(component.document) && documentLength > 0
  );
}

function Topbar({ saving, save }: { saving: boolean; save: () => void }) {
  const selected = useEditorStore((state) => state.selected);
  const setMode = useEditorStore((state) => state.setMode);
  const setCreateType = useEditorStore((state) => state.setCreateType);

  const [showBackgroundMenu, setShowBackgroundMenu] = useState(false);
  const [showPropertyMenu, setShowPropertyMenu] = useState(false);
  const { scenarioId } = useParams<{ scenarioId: string }>();
  const history = useHistory();

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

  const component = selected ? getComponent(selected) : null;

  return (
    <>
      <BackgroundMenu
        show={showBackgroundMenu}
        setShow={setShowBackgroundMenu}
      />
      <PropertyMenu show={showPropertyMenu} setShow={setShowPropertyMenu} />
      <ul className="topbar gap-0.5 menu menu-horizontal w-full bg-base-300 rounded-box py-1 px-3">
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
            {(hasTextboxComponent || hasDocument(component)) && (
              <>
                <div className="divider divider-horizontal" />
                <TextSection />
              </>
            )}
          </>
        )}
        {/* scene properties — only with an empty selection, like Google Slides */}
        {!hasSelection && (
          <>
            <div className="divider divider-horizontal" />
            <li className="text-xs">
              <button
                type="button"
                className="p-1.5"
                onClick={() => setShowBackgroundMenu(true)}
              >
                Background
              </button>
            </li>
          </>
        )}
        {/* scenario-wide controls, anchored right so they don't shift with the selection */}
        <li className="ml-auto text-xs">
          <button type="button" onClick={() => setShowPropertyMenu(true)}>
            <SlidersHorizontalIcon size={16} />
            Properties
          </button>
        </li>
        <li className="text-xs">
          <button
            type="button"
            onClick={() =>
              history.push(`/scenario/${scenarioId}/manage-resources`)
            }
          >
            <FilesIcon size={16} />
            Player Documents
          </button>
        </li>
        <div className="divider divider-horizontal" />
        <li className={`text-xs ${saving && "menu-disabled"}`}>
          <a onClick={save}>{saving ? "Saving" : "Save"}</a>
        </li>
      </ul>
    </>
  );
}

export default Topbar;
