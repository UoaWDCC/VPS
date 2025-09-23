import { arrayToObject, getObject } from "./util";

let scene = {
  components: {
    "123123": {
      id: "123123",
      type: "box",
      bounds: {
        verts: [
          { x: 300, y: 900 },
          { x: 800, y: 1000 },
        ],
        rotation: 30,
      },
      fill: "#ff0000ff",
      stroke: "#ffffffaa",
      strokeWidth: 10,
      zIndex: 0,
    },
    "126123": {
      id: "126123",
      type: "line",
      bounds: {
        verts: [
          { x: 300, y: 900 },
          { x: 800, y: 1000 },
        ],
      },
      stroke: "#ff00ffaa",
      strokeWidth: 10,
      zIndex: 0,
    },

    "123122": {
      id: "123122",
      type: "ellipse",
      strokeWidth: 0,
      bounds: {
        verts: [
          { x: 600, y: 400 },
          { x: 1000, y: 500 },
        ],
        rotation: 30,
      },
      fill: "#ffff00ff",
      zIndex: 0,
    },
    "123121": {
      id: "123121",
      type: "speech",
      bounds: {
        verts: [
          { x: 1200, y: 400 },
          { x: 1600, y: 500 },
          { x: 1800, y: 700 },
        ],
        rotation: 30,
      },
      fill: "#ffffffff",
      stroke: "#00ff00",
      strokeWidth: 5,
      zIndex: 0,
    },
    "321312": {
      id: "321312",
      type: "image",
      bounds: {
        verts: [
          { x: 400, y: 200 },
          { x: 800, y: 400 },
        ],
        rotation: 30,
      },
      href: "https://i.scdn.co/image/ab67616d00001e024738aa171569052376f162fe",
      preserveAspectRatio: "none",
      zIndex: 0,
    },
    "132312": {
      id: "132312",
      type: "textbox",
      bounds: {
        verts: [
          { x: 700, y: 500 },
          { x: 1100, y: 900 },
        ],
        rotation: 30,
      },
      padding: 20,
      fill: "#00000000",
      stroke: "#00ff00",
      strokeWidth: 5,
      zIndex: 0,
      document: {
        style: {
          fontFamily: "Helvetica",
          fontStyle: "normal",
          fontWeight: "normal",
          lineHeight: 1.1,
          fontSize: 24,
          textColor: "#ffffff",
          alignment: "left",
          highlightColor: "#00000000",
        },
        blocks: [
          {
            id: "398457",
            style: {},
            spans: [
              {
                style: {},
                text: "Hello from the ",
              },
              {
                style: {
                  fontWeight: "bold",
                  textColor: "#ff0000",
                  highlightColor: "#330000",
                },
                text: "world below, I am the ruler of this place. These are my subjects.",
              },
            ],
          },
          {
            id: "290834",
            style: {},
            spans: [
              {
                style: {},
                text: "We are pleased to meet you",
              },
              {
                style: {
                  fontFamily: "Times New Roman",
                  fontSize: 40,
                  textColor: "#ff00ff",
                },
                text: " after all this time ",
              },
              {
                style: {},
                text: "since you last came here.",
              },
            ],
          },
          {
            style: {},
            spans: [
              {
                style: {
                  fontFamily: "Georgia",
                  fontStyle: "italic",
                  fontSize: 20,
                  textDecoration: "underline",
                },
                text: "Please follow me...",
              },
            ],
          },
        ],
      },
    },
  } as Record<string, any>,
};

// @ts-ignore
window.scene = scene;

export function getScene() {
  return scene;
}

export function setScene(newScene: Record<string, any>) {
  scene = { ...newScene } as any;
}

export function getComponent(id: string) {
  return scene.components[id] ?? null;
}

export function getComponentProp(id: string, prop: string) {
  const component = scene.components[id];
  if (!component) return;
  const [object, key] = getObject(prop, component);
  return object[key];
}
