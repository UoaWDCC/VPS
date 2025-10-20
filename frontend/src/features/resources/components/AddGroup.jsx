import React, { useState } from "react";
import PropTypes from "prop-types";

function AddGroup({ onAdd }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  return (
    <div className="dropdown dropdown-end">
      <button
        className="btn btn-phantom btn-sm"
        onClick={() => setOpen((v) => !v)}
      >
        Create
      </button>
      {open && (
        <div className="dropdown-content z-[1] bg-base-200 rounded-box p-3 w-64 shadow">
          <label className="form-control w-full">
            <span className="label-text">Group name</span>
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

AddGroup.propTypes = {
  onAdd: PropTypes.func.isRequired,
};

export default React.memo(AddGroup);
