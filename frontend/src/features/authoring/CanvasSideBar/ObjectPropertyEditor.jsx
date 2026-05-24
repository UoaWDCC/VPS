import { modifyVerts } from "../../authoring/handlers/pointer/resize";

export function ObjectPropertyEditor({ component }) {
  // const [x, y] = component.bounds.verts[0];
  // const [width, height] = component.bounds.verts[1];
  // console.log(x, y, width, height);
  console.log(component.bounds.verts)

  function saveProp(v, type) {
    console.log(v, type)
    modifyVerts()
  }

  

  return (
    <div className="collapse overflow-visible collapse-arrow bg-base-300 rounded-sm text-s">
      <input type="checkbox" />
      <div className="collapse-title">Object Properties</div>
      <div className="collapse-content text--1 bg-base-200">
        <fieldset className="fieldset pt-2">
          <span className=" flex gap-17">
            <label className="label">Object Width</label>
            <label className="label">Object Height</label>
          </span>
          <div className="flex gap-15">
            <input
              type="number"
              className="input max-w-20"
              value={(component?.bounds.verts[1].x - component?.bounds.verts[0].x).toFixed(2)}
              onChange={(e) => saveProp(e.target.value, 'width')}
            />
            <input
              type="number"
              className="input max-w-20"
              value={(component?.bounds.verts[1].y - component?.bounds.verts[0].y).toFixed(2)}
              onChange={(e) => saveProp(e.target.value, 'height')}
            />
          </div>

          <span className=" flex gap-22">
            <label className="label">Position X</label>
            <label className="label">Position Y</label>
          </span>
          <div className="flex gap-15">
            <input
              type="number"
              className="input max-w-20"
              value={Math.round(component?.bounds.verts[0].x * 100) / 100}
              onChange={(e) => saveProp(e.target.value, 'x')}
            />
            <input
              type="number"
              className="input max-w-20"
              value={Math.round(component?.bounds.verts[0].y * 100) / 100}
              onChange={(e) => saveProp(e.target.value, 'y')}
            />
          </div>
        </fieldset>
      </div>
    </div>
  );
}
