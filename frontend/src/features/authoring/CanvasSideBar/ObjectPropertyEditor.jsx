import { translate } from "../../authoring/util";
import { useEffect, useState } from "react";
import { modifyVerts } from "../handlers/pointer/resize";
import { modifyComponentProp } from "../scene/operations/component";

export function ObjectPropertyEditor({ component }) {
  // x and y vals used for setting and current
  const [inputX, setInputX] = useState(
    Math.round(component.bounds.verts[0].x * 100) / 100
  );
  const [inputY, setInputY] = useState(
    Math.round(component.bounds.verts[0].y * 100) / 100
  );
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

  useEffect(() => {
    const width = Math.round(
      Math.abs(component.bounds.verts[1].x - component.bounds.verts[0].x) * 100
    ) / 100;
    const height = Math.round(
      Math.abs(component.bounds.verts[1].y - component.bounds.verts[0].y) * 100
    ) / 100;
    const x = Math.round(component.bounds.verts[0].x * 100) / 100;
    const y = Math.round(component.bounds.verts[0].y * 100) / 100;

    setInputWidth(width);
    setInputHeight(height);
    setInputX(x);
    setInputY(y);
  }, [component.bounds.verts]);

  //this could prolly be improved
  // uses the same function as the drag box feat w modifyComponentProp
  function saveProp(v, type) {
    const value = Number(v);

    if (type === "x") {
      const verts = component.bounds.verts;
      const diff = value - verts[0].x;
      modifyComponentProp(component.id, "bounds.verts", (prev) =>
        translate(prev, { x: diff, y: 0 })
      );
    } else if (type === "y") {
      const verts = component.bounds.verts;
      const diff = value - verts[0].y;
      modifyComponentProp(component.id, "bounds.verts", (prev) =>
        translate(prev, { x: 0, y: diff })
      );

      // idea is that because x and y are 2 diagonal corners
      // increase bottom y to expand height and
    } else if (type === "width") {
      if (value < 0) return;
      setInputWidth(value);
      const verts = component.bounds.verts;
      const xSign = Math.sign(verts[1].x - verts[0].x) || 1;
      const x = verts[0].x + xSign * value;
      console.log(x);
      modifyComponentProp(component.id, "bounds.verts", (prev) =>
        modifyVerts(prev, [1, 0.5], { x, y: 0 })
      );
    } else if (type === "height") {
      if (value < 0) return;
      setInputHeight(value);
      const verts = component.bounds.verts;
      const ySign = Math.sign(verts[1].y - verts[0].y) || 1;
      const y = verts[0].y + ySign * value;
      modifyComponentProp(component.id, "bounds.verts", (prev) =>
        modifyVerts(prev, [0.5, 1], { x: 0, y })
      );
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
              type="number"
              className="input max-w-21"
              value={inputWidth}
              onChange={(e) => saveProp(e.target.value, "width")}
            />
            <input
              type="number"
              className="input max-w-21"
              value={inputHeight}
              onChange={(e) => {
                saveProp(e.target.value, "height");
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
              type="number"
              className="input max-w-21"
              value={inputX}
              onChange={(e) => {
                setInputX(e.target.value);
                setTimeout(() => saveProp(e.target.value, "x"), 120);
              }}
            />
            <input
              type="number"
              className="input max-w-21"
              value={inputY}
              onChange={(e) => {
                setInputY(e.target.value);
                setTimeout(() => saveProp(e.target.value, "y"), 120);
              }}
            />
          </div>
        </fieldset>
      </div>
    </div>
  );
}
