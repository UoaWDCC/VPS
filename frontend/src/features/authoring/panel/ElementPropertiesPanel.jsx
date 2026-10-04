import { getBoxCenter, translate, correct } from "../../authoring/util";
import { useRef, useContext } from "react";
import { modifyComponentBounds } from "../scene/operations/component";
import { FlipHorizontal2, FlipVertical2 } from "lucide-react";
import PanelSection from "./PanelSection";
import PanelInput from "./PanelInput";
import SceneSelectInput from "../components/SceneSelectInput";
import SceneContext from "../../../context/SceneContext";
import useVisualScene from "../stores/visual";
import useField from "../inputs/useField";
import { cn } from "../../../util/classnames";
import { coerceFloat, coerceRequired, INVALID, pipe } from "../inputs/coerce";
import ActionRefsInput from "./actionRefs/ActionRefsInput";

function coerceAngle(raw) {
  return raw % 360;
}

function coercePosition(bounds, axis) {
  const other = axis === "x" ? "y" : "x";
  return (value) => {
    const diff = value - bounds.verts[0][axis];
    return translate(bounds.verts, { [axis]: diff, [other]: 0 });
  };
}

function coerceExtent(bounds, axis) {
  const other = axis === "x" ? "y" : "x";
  return (value) => {
    if (value === 0) return INVALID;
    const { verts } = bounds;
    const newVert = {
      [axis]: verts[0][axis] + value,
      [other]: verts[1][other],
    };
    const newVerts = [verts[0], newVert, verts[2]].filter(Boolean);
    return correct(newVerts, getBoxCenter(verts), bounds.rotation ?? 0);
  };
}

function round2dp(value) {
  return Math.round(value * 100) / 100;
}

/*
 * The content of the "Element Properties" panel.
 *
 * @component
 */
function ElementPropertiesPanel({ component }) {
  const { scenes } = useContext(SceneContext);
  const sceneId = useVisualScene((scene) => scene.id);

  const actionsRef = useRef(null);

  const xPositionField = useField("bounds.verts", {
    component: component?.id ?? null,
    derive: (v) => String(round2dp(v[0].x)),
    coerce: pipe(coerceFloat, coercePosition(component?.bounds, "x")),
  });
  const yPositionField = useField("bounds.verts", {
    component: component?.id ?? null,
    derive: (v) => String(round2dp(v[0].y)),
    coerce: pipe(coerceFloat, coercePosition(component?.bounds, "y")),
  });
  const widthField = useField("bounds.verts", {
    component: component?.id ?? null,
    derive: (v) => String(round2dp(v[1].x - v[0].x)),
    coerce: pipe(
      coerceFloat,
      coerceRequired,
      coerceExtent(component?.bounds, "x")
    ),
  });
  const heightField = useField("bounds.verts", {
    component: component?.id ?? null,
    derive: (v) => String(round2dp(v[1].y - v[0].y)),
    coerce: pipe(
      coerceFloat,
      coerceRequired,
      coerceExtent(component?.bounds, "y")
    ),
  });
  const rotationField = useField("bounds.rotation", {
    derive: (v) => String(round2dp(v)),
    coerce: pipe(coerceFloat, coerceAngle),
    component: component?.id ?? null,
  });

  const linkedSceneField = useField("linkedScene", {
    empty: null,
    commit: "onChange",
    component: component?.id ?? null,
  });

  if (!component) return null;

  function flipComponent(axis) {
    modifyComponentBounds([component.id], (prev) => {
      const center = getBoxCenter(prev.verts);
      return {
        ...prev,
        verts: prev.verts.map((v) => ({
          x: axis === "x" ? 2 * center.x - v.x : v.x,
          y: axis === "y" ? 2 * center.y - v.y : v.y,
        })),
        rotation: 360 - (prev.rotation ?? 0),
      };
    });
  }

  return (
    <>
      <PanelSection name="Button Link" id="button-link">
        <PanelInput label="Linked Scene">
          <SceneSelectInput
            {...linkedSceneField.props}
            scenes={scenes}
            exclusionId={sceneId}
          />
        </PanelInput>
        <PanelInput label="Actions" onAdd={() => actionsRef.current?.addItem()}>
          {/* need to explicitly pass null here to differ vs non-component fields */}
          <ActionRefsInput
            ref={actionsRef}
            locator="actionRefs"
            component={component?.id ?? null}
          />
        </PanelInput>
      </PanelSection>
      <PanelSection name="Positioning" id="positioning">
        <div className="flex gap-2">
          <PanelInput label="Width">
            <input
              {...widthField.props}
              type="text"
              inputMode="decimal"
              className={cn("input", widthField.error && "input-error")}
            />
          </PanelInput>
          <PanelInput label="Height">
            <input
              {...heightField.props}
              type="text"
              inputMode="decimal"
              className={cn("input", heightField.error && "input-error")}
            />
          </PanelInput>
        </div>
        <div className="flex gap-2">
          <PanelInput label="X Position">
            <input
              {...xPositionField.props}
              type="text"
              inputMode="decimal"
              className={cn("input", xPositionField.error && "input-error")}
            />
          </PanelInput>
          <PanelInput label="Y Position">
            <input
              {...yPositionField.props}
              type="text"
              inputMode="decimal"
              className={cn("input", yPositionField.error && "input-error")}
            />
          </PanelInput>
        </div>
        <div className="flex gap-2">
          <PanelInput label="Angle (Degrees)">
            <input
              {...rotationField.props}
              type="text"
              inputMode="decimal"
              className={cn("input", rotationField.error && "input-error")}
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
