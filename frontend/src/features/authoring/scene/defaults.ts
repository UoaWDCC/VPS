// Starting properties for each kind of component the editor can create.
// Kept apart from the live scene so anything can use them, tests included.

export const defaults = {
  textbox: {
    type: "textbox",
    padding: 20,
    clickable: true,
    fill: "#00000000", // default value is rgba 0
    stroke: "#00000000",
    strokeWidth: 3, // default stroke width 3
    bounds: {
      verts: [
        { x: 0, y: 0 },
        { x: 600, y: 100 },
      ],
      rotation: 0,
    },
    document: {
      style: {},
      blocks: [
        {
          style: { alignment: "left" },
          spans: [
            {
              style: {},
              text: "",
            },
          ],
        },
      ],
    },
    zIndex: 0,
  },
  line: {
    type: "line",
    stroke: "#b7b7b7ff",
    strokeWidth: 5,
    clickable: true,
    bounds: {
      verts: [
        { x: 0, y: 0 },
        { x: 100, y: 100 },
      ],
    },
    zIndex: 0,
  },
  speech: {
    type: "speech",
    fill: "#b7b7b7ff",
    stroke: "#00000000",
    strokewidth: 3,
    clickable: true,
    bounds: {
      verts: [
        { x: 0, y: 0 },
        { x: 400, y: 100 },
        { x: 400, y: 120 },
      ],
      rotation: 0,
    },
    document: {
      style: {},
      blocks: [
        {
          style: {},
          spans: [
            {
              style: {},
              text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla venenatis.",
            },
          ],
        },
      ],
    },
    zIndex: 0,
  },
  box: {
    type: "box",
    clickable: true,
    fill: "#b7b7b7ff",
    stroke: "#00000000",
    strokewidth: 3,
    bounds: {
      verts: [
        { x: 0, y: 0 },
        { x: 100, y: 100 },
      ],
      rotation: 0,
    },
    zIndex: 0,
  },
  ellipse: {
    type: "ellipse",
    fill: "#b7b7b7ff",
    clickable: true,
    stroke: "#00000000",
    strokewidth: 3,
    bounds: {
      verts: [
        { x: 0, y: 0 },
        { x: 100, y: 100 },
      ],
      rotation: 0,
    },
    zIndex: 0,
  },
  image: {
    type: "image",
    clickable: true,
    preserveAspectRatio: "none",
    bounds: {
      verts: [
        { x: 0, y: 0 },
        { x: 300, y: 300 },
      ],
      rotation: 0,
    },
    zIndex: 0,
  },
};
