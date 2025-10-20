import {
  Diameter,
  MessageSquare,
  ShapesIcon,
  Spline,
  VectorSquare,
} from "lucide-react";
import useEditorStore from "../stores/editor";

function ShapeCreateMenu() {
  const setMode = useEditorStore((state) => state.setMode);
  const setCreateType = useEditorStore((state) => state.setCreateType);

  const switchCreate = (type: string) => {
    setMode(["create"]);
    setCreateType(type);
  };

  return (
    <>
      <div className="dropdown">
        <li>
          <a tabIndex={0}>
            <ShapesIcon size={16} />
          </a>
        </li>
        <ul
          tabIndex={0}
          className="dropdown-content menu menu-horizontal bg-base-300 rounded-box z-1 p-2 shadow-sm top-[38px] w-max"
        >
          <li>
            <a onClick={() => switchCreate("box")}>
              <VectorSquare size={16} />
            </a>
          </li>
          <li>
            <a onClick={() => switchCreate("ellipse")}>
              <Diameter size={16} />
            </a>
          </li>
          <li>
            <a onClick={() => switchCreate("line")}>
              <Spline size={16} />
            </a>
          </li>
          <li>
            <a onClick={() => switchCreate("speech")}>
              <MessageSquare size={16} />
            </a>
          </li>
        </ul>
      </div>
    </>
  );
}

export default ShapeCreateMenu;
