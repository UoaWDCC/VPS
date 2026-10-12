import { BUTTON_SIZE } from "./presets.js";

/**
 * The component for a preset button, centred on the canvas. It's an ordinary
 * box or ellipse with text in it, so it can be restyled, moved and given a
 * destination or property change like any shape the author draws.
 *
 * @param {object} preset - one of BUTTON_PRESETS
 * @param {object} options
 * @param {string} options.id
 * @param {number} options.zIndex - where to put it in the stack
 * @param {{ width: number, height: number }} options.canvas
 */
export function buttonComponent(preset, { id, zIndex, canvas }) {
  const { width, height } = BUTTON_SIZE;
  const x = Math.round((canvas.width - width) / 2);
  const y = Math.round((canvas.height - height) / 2);

  return {
    id,
    type: preset.shape,
    clickable: true,
    fill: preset.fill,
    stroke: preset.stroke,
    strokeWidth: preset.strokeWidth,
    bounds: {
      verts: [
        { x, y },
        { x: x + width, y: y + height },
      ],
      rotation: 0,
    },
    zIndex,
    document: {
      style: {
        fontFamily: "Arial",
        fontSize: 44,
        fontWeight: "bold",
        textColor: preset.textColor,
      },
      blocks: [
        {
          style: { alignment: "center" },
          spans: [{ style: {}, text: preset.label }],
        },
      ],
    },
  };
}
