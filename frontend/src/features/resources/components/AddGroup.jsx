import React, { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";

function AddGroup({ onAdd }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  const closeDropdown = () => {
    setOpen(false);
    setName("");
  };

  const addCollection = () => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      return;
    }

    onAdd(trimmedName);
    closeDropdown();
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addCollection();
    }

    if (event.key === "Escape") {
      closeDropdown();
    }
  };

  return (
    <div
      className={`dropdown dropdown-end ${
        open ? "dropdown-open" : ""
      }`}
    >
      <button
        type="button"
        className="btn btn-phantom btn-sm"
        aria-expanded={open}
        aria-controls="create-collection-dropdown"
        onClick={() => setOpen((value) => !value)}
      >
        Create collection
      </button>

      {open && (
        <div
          id="create-collection-dropdown"
          className="dropdown-content z-[1] bg-base-200 rounded-box p-3 w-64 shadow"
        >
          <label className="form-control w-full">
            <span className="label-text">Collection name</span>

            <input
              ref={inputRef}
              className="input input-bordered input-sm"
              value={name}
              onChange={(event) => setName(event.target.value)}
              onKeyDown={handleKeyDown}
            />
          </label>

          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={closeDropdown}
            >
              Cancel
            </button>

            <button
              type="button"
              className="btn btn-primary btn-sm"
              disabled={!name.trim()}
              onClick={addCollection}
            >
              Add collection
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