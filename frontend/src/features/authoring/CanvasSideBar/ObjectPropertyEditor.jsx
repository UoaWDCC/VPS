import { getBoxCenter, translate } from "../../authoring/util";
import { useEffect, useState } from "react";
import { modifyVerts } from "../handlers/pointer/resize";
import { modifyComponentProp } from "../scene/operations/component";
import {
  SquareCenterlineDashedHorizontal,
  SquareCenterlineDashedVertical,
} from "lucide-react";

export function ObjectPropertyEditor({ component }) {
  // x and y vals used for setting and current
  const [inputX, setInputX] = useState(
    Math.round(component.bounds.verts[0].x * 100) / 100
  );
  const [inputY, setInputY] = useState(
    Math.round(component.bounds.verts[0].y * 100) / 100
  );
  // Width and height vals
  const [inputWidth, setInputWidth] = useState(
    Math.round(
      (component.bounds.verts[1].x - component.bounds.verts[0].x) * 100
    ) / 100
  );
  const [inputHeight, setInputHeight] = useState(
    Math.round(
      (component.bounds.verts[1].y - component.bounds.verts[0].y) * 100
    ) / 100
  );
  const [inputAngle, setInputAngle] = useState(
    Math.round((component.bounds.rotation ?? 0) * 100) / 100
  );

  useEffect(() => {
    const width =
      Math.round(
        (component.bounds.verts[1].x - component.bounds.verts[0].x) * 100
      ) / 100;
    const height =
      Math.round(
        (component.bounds.verts[1].y - component.bounds.verts[0].y) * 100
      ) / 100;
    const x = Math.round(component.bounds.verts[0].x * 100) / 100;
    const y = Math.round(component.bounds.verts[0].y * 100) / 100;
    const rotation = Math.round((component.bounds.rotation ?? 0) * 100) / 100;

    setInputWidth(width);
    setInputHeight(height);
    setInputX(x);
    setInputY(y);
    setInputAngle(rotation);
  }, [component.bounds.verts, component.bounds.rotation]);

  function flipComponent(axis) {
    modifyComponentProp(component.id, "bounds.verts", (prev) => {
      const center = getBoxCenter(prev);
      return prev.map((v) => ({
        x: axis === "x" ? 2 * center.x - v.x : v.x,
        y: axis === "y" ? 2 * center.y - v.y : v.y,
      }));
    });
  }

  // sets the value then flips it
  function negativeFlip(type, value) {
    const absValue = Math.abs(value);
    const axis = type === "width" ? "x" : "y";

    modifyComponentProp(component.id, "bounds.verts", (prev) => {
      let verts =
        type === "width"
          ? modifyVerts(prev, [1, 0.5], { x: prev[0].x + absValue, y: 0 })
          : modifyVerts(prev, [0.5, 1], { x: 0, y: prev[0].y + absValue });

      const center = getBoxCenter(verts);
      return verts.map((v) => ({
        x: axis === "x" ? 2 * center.x - v.x : v.x,
        y: axis === "y" ? 2 * center.y - v.y : v.y,
      }));
    });
  }

  function inputValidation(type, v, set) {
    if (v === "" || v === "-" || v.at(-1) === ".") {
      set(v);
      return null;
    }

    const value = parseFloat(String(v).trim());
    if (isNaN(value)) return null;

    if (value === 0) {
      set(1);
      return 1;
    }

    set(value);

    if (value < 0) {
      negativeFlip(type, value);
      return null;
    }

    return value;
  }

  function parseInput(v, set) {
    if (v === "" || v === "-") {
      set(v);
      return null;
    }

    const value = parseFloat(String(v).trim());
    if (isNaN(value)) return null;

    set(value);
    return value;
  }

  // uses the same function as the drag box feat w modifyComponentProp
  function saveProp(v, type, set) {
    const value =
      type === "width" || type === "height"
        ? inputValidation(type, v, set)
        : parseInput(v, set);
    if (value === null) return;
    const verts = component.bounds.verts;

    if (type === "x") {
      const diff = value - verts[0].x;
      modifyComponentProp(component.id, "bounds.verts", (prev) =>
        translate(prev, { x: diff, y: 0 })
      );
    } else if (type === "y") {
      const diff = value - verts[0].y;
      modifyComponentProp(component.id, "bounds.verts", (prev) =>
        translate(prev, { x: 0, y: diff })
      );
      // increase bottom y to expand height and same idea with x
    } else if (type === "width") {
      const x = verts[0].x + value;
      modifyComponentProp(component.id, "bounds.verts", (prev) =>
        modifyVerts(prev, [1, 0.5], { x, y: 0 })
      );
    } else if (type === "height") {
      const y = verts[0].y + value;
      modifyComponentProp(component.id, "bounds.verts", (prev) =>
        modifyVerts(prev, [0.5, 1], { x: 0, y })
      );
    } else if (type === "rotation") {
      modifyComponentProp(component.id, "bounds.rotation", value);
    }
  }

  return (
    <div className="collapse overflow-visible collapse-arrow bg-base-300 rounded-sm text-s">
      <input type="checkbox" />
      <div className="collapse-title">Object Properties</div>
      <div className="collapse-content text--1 bg-base-200">
        <fieldset className="fieldset pt-2">
          {/* Width and Height num inputs*/}
          <span className=" flex gap-17">
            <label className="label">Object Width</label>
            <label className="label">Object Height</label>
          </span>
          <div className="flex gap-13">
            <input
              className="input max-w-21"
              value={inputWidth}
              onChange={(e) => {
                saveProp(e.target.value, "width", setInputWidth);
              }}
            />
            <input
              className="input max-w-21"
              value={inputHeight}
              onChange={(e) => {
                saveProp(e.target.value, "height", setInputHeight);
              }}
            />
          </div>

          {/* positoin x and y num inputs*/}
          <span className=" flex gap-22">
            <label className="label">Position X</label>
            <label className="label">Position Y</label>
          </span>
          <div className="flex gap-13">
            <input
              className="input max-w-21"
              value={inputX}
              onChange={(e) => {
                saveProp(e.target.value, "x", setInputX);
              }}
            />
            <input
              className="input max-w-21"
              value={inputY}
              onChange={(e) => {
                saveProp(e.target.value, "y", setInputY);
              }}
            />
          </div>
          <label className="label">Angle</label>
          <div className="flex gap-13">
            <input
              className="input max-w-21"
              value={inputAngle}
              onChange={(e) =>
                saveProp(e.target.value, "rotation", setInputAngle)
              }
            />
            <div className="flex gap-3">
              <button
                type="button"
                className="hover:bg-stone-800 cursor-pointer rounded-sm"
                onClick={() => flipComponent("x")}
              >
                <SquareCenterlineDashedHorizontal className="m-2" />
              </button>
              <button
                type="button"
                className="hover:bg-stone-800 cursor-pointer rounded-sm"
                onClick={() => flipComponent("y")}
              >
                <SquareCenterlineDashedVertical className="m-2" />
              </button>
            </div>
          </div>
        </fieldset>
      </div>
    </div>
  );
}
