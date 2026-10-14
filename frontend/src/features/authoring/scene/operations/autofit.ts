import { pad } from "../../pipeline";
import { buildVisualDocument, squash } from "../../text/build";
import type {
  BaseTextStyle,
  Component,
  RelativeBounds,
  TextBoxComponent,
} from "../../types";
import { correct, getBoxCenter, getRelativeBounds } from "../../util";

// sub-pixel differences aren't worth a resize, and would churn on every keystroke
const EPSILON = 0.5;

// height of a box holding one empty line i.e. the floor fitTextBox shrinks an emptied one back down to
export function getSingleLineHeight(
  padding: number,
  style?: Partial<BaseTextStyle>
) {
  const { fontSize, lineHeight } = squash(style);
  return lineHeight * fontSize + padding * 2;
}

// outer height the text needs, including padding above and below
function getRequiredHeight(component: TextBoxComponent) {
  const relative = getRelativeBounds(
    pad(component.bounds.verts, component.padding)
  ) as RelativeBounds;
  relative.rotation = component.bounds.rotation;

  const doc = buildVisualDocument({
    ...component.document,
    bounds: relative,
    id: component.id,
  });

  const last = doc.blocks[doc.blocks.length - 1];
  if (!last) return null;

  return last.y + last.height + component.padding * 2;
}

function getHeight(component: Component) {
  const { verts } = component.bounds;
  return Math.abs(verts[1].y - verts[0].y);
}

// a user edit that changed a box's height should be kept as the box's minimum
export function recordManualHeight(
  component: Component,
  previous: Component | null
) {
  if (component.type !== "textbox" || previous?.type !== "textbox") return;

  const height = getHeight(component);
  if (Math.abs(height - getHeight(previous)) > EPSILON)
    component.minHeight = height;
}

// resize shape to fit text content but never drop below a height the user resized to
export function fitTextBox(component: Component) {
  if (component.type !== "textbox") return false;

  const { verts, rotation } = component.bounds;
  const height = getHeight(component);
  const required = getRequiredHeight(component);

  if (required == null || !Number.isFinite(required)) return false;
  const target = Math.max(required, component.minHeight ?? 0);
  if (Math.abs(height - target) <= EPSILON) return false;

  // anchor the top edge and move the bottom one to meet the text
  const topI = verts[0].y <= verts[1].y ? 0 : 1;
  const newVerts = verts.map((vert) => ({ ...vert }));
  newVerts[1 - topI].y = verts[topI].y + target;

  // resizing moves the box centre, which is also the rotation origin, so we need to recalculate it
  component.bounds.verts = correct(newVerts, getBoxCenter(verts), rotation);

  return true;
}
