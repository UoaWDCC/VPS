import {
  BringToFront,
  Diameter,
  ImageIcon,
  MessageSquare,
  Redo,
  SendToBack,
  Spline,
  Trash2,
  Type,
  Undo,
  VectorSquare,
} from "lucide-react";
import ShapeSection from "./ShapeSection";
import TextSection from "./TextSection";
import useEditorStore from "../stores/editor";
import { getComponent } from "../scene/scene";
import { redo, undo } from "../scene/history";
import { bringToFront, sendToBack } from "../scene/operations/component";
import { remove } from "../scene/operations/modifiers";
import { useRef, useState } from "react";
import { addFirebaseImage } from "../ToolBar/ToolBarActions";
import StateVariableMenu from "../../../components/StateVariables/StateVariableMenu";

function Topbar() {
  const selected = useEditorStore(state => state.selected);
  const setSelected = useEditorStore(state => state.setSelected);
  const setMode = useEditorStore(state => state.setMode);
  const setCreateType = useEditorStore(state => state.setCreateType);

  const [showSVMenu, setShowSVMenu] = useState(false);

  function toggleSVMenu() {
    setShowSVMenu(prev => !prev);
  }

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  function removeComponent() {
    if (!selected) return;
    remove(selected);
    setSelected("");
  }

  const switchCreate = (type: string) => {
    setMode(["create"]);
    setCreateType(type);
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) addFirebaseImage(file);
  };

  const component = selected ? getComponent(selected) : null;

  return <>
    <StateVariableMenu show={showSVMenu} setShow={setShowSVMenu} />
    <div className="topbar">
      <div className="props" style={{ zIndex: 1 }}>
        <button className="px-2 text-sm rounded-sm h-[28px] hover:bg-[#0f0f0f]" onClick={toggleSVMenu}>
          <span>State Variables</span>
        </button>

        |

        {/* undo/redo */}
        <button className="button" onClick={undo}>
          <Undo size={16} />
        </button>
        <button className="button" onClick={redo}>
          <Redo size={16} />
        </button>

        |

        {/* element creation */}
        <details className="dropdown z-100">
          <summary className="button"><ImageIcon size={16} /></summary>
          <ul className="menu dropdown-content bg-base-100 rounded-box z-1 w-52 p-2 shadow-sm">
            <li><a onClick={handleFileClick}>Upload Image</a></li>
          </ul>
        </details>

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
        />

        <button className="button" onClick={() => switchCreate("box")}>
          <VectorSquare size={16} />
        </button>
        <button className="button" onClick={() => switchCreate("ellipse")}>
          <Diameter size={16} />
        </button>
        <button className="button" onClick={() => switchCreate("line")}>
          <Spline size={16} />
        </button>
        <button className="button" onClick={() => switchCreate("textbox")}>
          <Type size={16} />
        </button>
        <button className="button" onClick={() => switchCreate("speech")}>
          <MessageSquare size={16} />
        </button>

        {/* element properties */}
        {selected && (
          <>
            |

            {/* remove/reorder */}
            <button className="button" onClick={removeComponent}>
              <Trash2 size={16} />
            </button>
            <button
              className="button"
              onClick={() => bringToFront(selected)}
            >
              <BringToFront size={16} />
            </button>
            <button
              className="button"
              onClick={() => sendToBack(selected)}
            >
              <SendToBack size={16} />
            </button>

            {/* shape properties */}
            {component.type !== "image" && <>
              |
              <ShapeSection />
            </>}

            {/* text content styles */}
            {component.type === "textbox" && <>
              |
              <TextSection />
            </>}
          </>
        )}
      </div>
    </div>
  </>;
}

export default Topbar;
