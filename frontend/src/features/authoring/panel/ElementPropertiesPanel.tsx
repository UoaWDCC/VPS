import { getBoxCenter, translate, correct } from "../../authoring/util";
import { useRef, useContext, type Context } from "react";
import { modifyComponentBounds } from "../scene/operations/component";
import { FlipHorizontal2, FlipVertical2 } from "lucide-react";
import PanelSection from "./PanelSection";
import PanelInput from "./PanelInput";
import SceneSelectInput from "../components/SceneSelectInput";
import SceneContext from "../../../context/SceneContext";
import useVisualScene from "../stores/visual";
import useField from "../inputs/useField";
import { cn } from "../../../util/classnames";
import {
  coerceFloat,
  coerceRequired,
  INVALID,
  pipe,
  type Coerced,
} from "../inputs/coerce";
import ActionRefsInput, {
  type ActionRefsInputHandle,
} from "./actionRefs/ActionRefsInput";
import type { Bounds, Component, Scene, Vec2 } from "../types";

type Axis = "x" | "y";

// an empty input is treated as 0
function coerceAngle(raw: number | null) {
  return (raw ?? 0) % 360;
}

function coercePosition(bounds: Bounds | undefined, axis: Axis) {
  return (value: number | null): Coerced<Vec2[]> => {
    if (!bounds) return INVALID;
    const diff = (value ?? 0) - bounds.verts[0][axis];
    return translate(
      bounds.verts,
      axis === "x" ? { x: diff, y: 0 } : { x: 0, y: diff }
    );
  };
}

function coerceExtent(bounds: Bounds | undefined, axis: Axis) {
  return (value: number): Coerced<Vec2[]> => {
    if (!bounds || value === 0) return INVALID;
    const { verts } = bounds;
    const newVert =
      axis === "x"
        ? { x: verts[0].x + value, y: verts[1].y }
        : { x: verts[1].x, y: verts[0].y + value };
    const newVerts = [verts[0], newVert, verts[2]].filter(Boolean);
    return correct(newVerts, getBoxCenter(verts), bounds.rotation ?? 0);
  };
}

function round2dp(value: number) {
  return Math.round(value * 100) / 100;
}

interface ElementPropertiesPanelProps {
  component: Component | null;
}

/*
 * The content of the "Element Properties" panel.
 *
 * @component
 */
function ElementPropertiesPanel({ component }: ElementPropertiesPanelProps) {
  const { scenes } = useContext(SceneContext as Context<{ scenes: Scene[] }>);
  const sceneId = useVisualScene((scene) => scene.id);

  const actionsRef = useRef<ActionRefsInputHandle | null>(null);

  const xPositionField = useField<Vec2[], string>("bounds.verts", {
    component: component?.id ?? null,
    derive: (v) => String(round2dp(v[0].x)),
    coerce: pipe(coerceFloat, coercePosition(component?.bounds, "x")),
  });
  const yPositionField = useField<Vec2[], string>("bounds.verts", {
    component: component?.id ?? null,
    derive: (v) => String(round2dp(v[0].y)),
    coerce: pipe(coerceFloat, coercePosition(component?.bounds, "y")),
  });
  const widthField = useField<Vec2[], string>("bounds.verts", {
    component: component?.id ?? null,
    derive: (v) => String(round2dp(v[1].x - v[0].x)),
    coerce: pipe(
      coerceFloat,
      coerceRequired<number>,
      coerceExtent(component?.bounds, "x")
    ),
  });
  const heightField = useField<Vec2[], string>("bounds.verts", {
    component: component?.id ?? null,
    derive: (v) => String(round2dp(v[1].y - v[0].y)),
    coerce: pipe(
      coerceFloat,
      coerceRequired<number>,
      coerceExtent(component?.bounds, "y")
    ),
  });
  const rotationField = useField<number, string>("bounds.rotation", {
    derive: (v) => String(round2dp(v)),
    coerce: pipe(coerceFloat, coerceAngle),
    component: component?.id ?? null,
  });

  const linkedSceneField = useField<string | null>("linkedScene", {
    empty: null,
    commit: "onChange",
    component: component?.id ?? null,
  });

  if (!component) return null;

  const { id } = component;

  function flipComponent(axis: Axis) {
    modifyComponentBounds([id], (prev) => {
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
