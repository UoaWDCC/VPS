import { getBoxCenter, translate, correct } from "../../authoring/util";
import { useEffect, useState, useRef, useContext } from "react";
import { modifyComponentProp } from "../scene/operations/component";
import { FlipHorizontal2, FlipVertical2 } from "lucide-react";
import PanelSection from "./PanelSection";
import PanelInput from "./PanelInput";
import SceneSelectInput from "../components/SceneSelectInput";
import SceneContext from "../../../context/SceneContext";
import useVisualScene from "../stores/visual";
import ActionsInput from "../components/ActionsInput";

const ZERO_VERTS = [
  { x: 0, y: 0 },
  { x: 0, y: 0 },
];

/*
 * The content of the "Element Properties" panel.
 *
 * @component
 */
function ElementPropertiesPanel({ component }) {
  const verts = component?.bounds?.verts ?? ZERO_VERTS;
  const { scenes } = useContext(SceneContext);
  const sceneId = useVisualScene((scene) => scene.id);

  const actionsRef = useRef(null);

  // x and y vals used for setting and current
  const [inputX, setInputX] = useState(Math.round(verts[0].x * 100) / 100);
  const [inputY, setInputY] = useState(Math.round(verts[0].y * 100) / 100);
  // Width and height vals
  const [inputWidth, setInputWidth] = useState(
    Math.round((verts[1].x - verts[0].x) * 100) / 100
  );
  const [inputHeight, setInputHeight] = useState(
    Math.round((verts[1].y - verts[0].y) * 100) / 100
  );
  const [inputAngle, setInputAngle] = useState(
    (Math.round((component?.bounds?.rotation ?? 0) * 100) / 100) % 360
  );

  useEffect(() => {
    const verts = component?.bounds?.verts ?? ZERO_VERTS;
    const width = Math.round((verts[1].x - verts[0].x) * 100) / 100;
    const height = Math.round((verts[1].y - verts[0].y) * 100) / 100;
    const x = Math.round(verts[0].x * 100) / 100;
    const y = Math.round(verts[0].y * 100) / 100;
    const rotation = Math.round((component?.bounds?.rotation ?? 0) * 100) / 100;

    setInputWidth(width);
    setInputHeight(height);
    setInputX(x);
    setInputY(y);
    setInputAngle(rotation);
  }, [component?.bounds?.verts, component?.bounds?.rotation]);

  const latestValues = useRef({});
  latestValues.current = {
    inputX,
    inputY,
    inputWidth,
    inputHeight,
    inputAngle,
  };

  useEffect(() => {
    return () => {
      const { inputX, inputY, inputWidth, inputHeight, inputAngle } =
        latestValues.current;
      noFields([
        [inputX, "x", setInputX],
        [inputY, "y", setInputY],
        [inputHeight, "height", setInputHeight],
        [inputWidth, "width", setInputWidth],
        [inputAngle, "rotation", setInputAngle],
      ]);
    };
  }, [component?.id]);

  if (!component) return null;

  function flipComponent(axis) {
    modifyComponentProp([component.id], "bounds.verts", (prev) => {
      const center = getBoxCenter(prev);
      return prev.map((v) => ({
        x: axis === "x" ? 2 * center.x - v.x : v.x,
        y: axis === "y" ? 2 * center.y - v.y : v.y,
      }));
    });
    modifyComponentProp(
      [component.id],
      "bounds.rotation",
      (prev) => 360 - (prev ?? 0)
    );
  }

  function noFields(values) {
    values.forEach((value) => {
      const v = value[0];
      const type = value[1];
      const set = value[2];
      if (v === "") {
        saveProp("0", type, set);
      }
    });
  }

  function inputValidation(type, v, set, prevValue) {
    if (v === "" || v === "-" || v.at(-1) === "." || v.slice(-2) === ".0") {
      set(v);
      return null;
    }

    const value = parseFloat(String(v).trim());
    if (isNaN(value)) return null;

    if (value === 0 && prevValue !== null) {
      set(1);
      return 1;
    }
    set(value);

    if (Math.sign(value) !== Math.sign(prevValue) && prevValue !== null) {
      flipComponent(type === "width" ? "x" : "y");
    }

    return value;
  }

  // uses the same function as the drag box feat w modifyComponentProp
  function saveProp(v, type, set) {
    if (!component) return;
    const value = inputValidation(
      type,
      v,
      set,
      type === "width" || type === "height"
        ? type === "width"
          ? inputWidth
          : inputHeight
        : null
    );
    if (value === null) return;
    const verts = component.bounds.verts;

    if (type === "x") {
      const diff = value - verts[0].x;
      modifyComponentProp([component.id], "bounds.verts", (prev) =>
        translate(prev, { x: diff, y: 0 })
      );
    } else if (type === "y") {
      const diff = value - verts[0].y;
      modifyComponentProp([component.id], "bounds.verts", (prev) =>
        translate(prev, { x: 0, y: diff })
      );
      // increase bottom y to expand height and same idea with x
    } else if (type === "width") {
      const rotation = component.bounds.rotation ?? 0;
      modifyComponentProp([component.id], "bounds.verts", (prev) => {
        const center = getBoxCenter(prev);
        const newVerts = [
          prev[0],
          { x: prev[0].x + value, y: prev[1].y },
          prev[2],
        ].filter(Boolean);
        return correct(newVerts, center, rotation);
      });
    } else if (type === "height") {
      const rotation = component.bounds.rotation ?? 0;
      modifyComponentProp([component.id], "bounds.verts", (prev) => {
        const center = getBoxCenter(prev);
        const newVerts = [
          prev[0],
          { x: prev[1].x, y: prev[0].y + value },
          prev[2],
        ].filter(Boolean);
        return correct(newVerts, center, rotation);
      });
    } else if (type === "rotation") {
      modifyComponentProp([component.id], "bounds.rotation", value % 360);
    }
  }

  function saveActionRefs(updated) {
    modifyComponentProp([component.id], "actionRefs", updated);
  }

  function deleteActionRef(id) {
    saveActionRefs(component.actionRefs.filter((ref) => ref.id !== id));
  }

  return (
    <>
      <PanelSection name="Button Link" id="button-link">
        <PanelInput label="Default Linked Scene">
          <SceneSelectInput
            scenes={scenes}
            value={null}
            exclusionId={sceneId}
            onChange={console.log}
          />
        </PanelInput>
        <PanelInput label="Actions" onAdd={() => actionsRef.current?.addItem()}>
          <ActionsInput
            ref={actionsRef}
            items={component.actionRefs ?? []}
            onDelete={deleteActionRef}
            onReorder={saveActionRefs}
          />
        </PanelInput>
      </PanelSection>
      <PanelSection name="Positioning" id="positioning">
        <div className="flex gap-2">
          <PanelInput label="Width">
            <input
              type="number"
              className="input"
              value={inputWidth}
              onChange={(e) => saveProp(e.target.value, "width", setInputWidth)}
            />
          </PanelInput>
          <PanelInput label="Height">
            <input
              type="number"
              className="input"
              value={inputHeight}
              onChange={(e) =>
                saveProp(e.target.value, "height", setInputHeight)
              }
            />
          </PanelInput>
        </div>
        <div className="flex gap-2">
          <PanelInput label="X Position">
            <input
              type="number"
              className="input"
              value={inputX}
              onChange={(e) => saveProp(e.target.value, "x", setInputX)}
            />
          </PanelInput>
          <PanelInput label="Y Position">
            <input
              type="number"
              className="input"
              value={inputY}
              onChange={(e) => saveProp(e.target.value, "y", setInputY)}
            />
          </PanelInput>
        </div>
        <div className="flex gap-2">
          <PanelInput label="Angle (Degrees)">
            <input
              type="number"
              className="input"
              value={inputAngle}
              onChange={(e) =>
                saveProp(e.target.value, "rotation", setInputAngle)
              }
            />
          </PanelInput>
          <PanelInput>
            <div className="flex gap-1">
              <button
                type="button"
                title="Flip Horizontally"
                aria-label="flip horizontally"
                className="btn btn-panel !justify-center"
                onClick={() => flipComponent("x")}
              >
                <FlipHorizontal2 size={18} />
              </button>
              <button
                type="button"
                title="Flip Vertically"
                aria-label="flip vertically"
                className="btn btn-panel !justify-center"
                onClick={() => flipComponent("y")}
              >
                <FlipVertical2 size={18} />
              </button>
            </div>
          </PanelInput>
        </div>
      </PanelSection>
    </>
  );
}

export default ElementPropertiesPanel;
