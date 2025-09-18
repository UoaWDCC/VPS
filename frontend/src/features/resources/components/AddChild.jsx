import React, { useState } from "react";
import PropTypes from "prop-types";

function AddChild({ onAdd }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  return (
    <div className="dropdown dropdown-end">
      <button
        className="btn btn-ghost btn-xs"
        onClick={() => setOpen((v) => !v)}
        title="Add sub-item"
      >
        ＋
      </button>
      {open && (
        <div className="dropdown-content z-[1] bg-base-100 rounded-box p-3 w-60 shadow">
          <label className="form-control w-full">
            <span className="label-text">Sub-item name</span>
            <input
              className="input input-bordered input-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <div className="mt-3 flex justify-end gap-2">
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setOpen(false)}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                if (!name.trim()) return;
                onAdd(name.trim());
                setName("");
                setOpen(false);
              }}
            >
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

AddChild.propTypes = {
  onAdd: PropTypes.func.isRequired,
};

export default React.memo(AddChild);
