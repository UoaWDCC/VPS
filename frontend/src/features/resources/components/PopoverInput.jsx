import { cloneElement, memo, useEffect, useRef, useState } from "react";

function PopoverInput({ onSubmit, label, submitLabel, trigger }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");

  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  function closeDropdown() {
    setOpen(false);
    setInput("");
  }

  useEffect(() => {
    if (!open) return;
    function handleClickOutside({ target }) {
      if (dropdownRef.current?.contains(target)) return;
      setOpen(false);
      setInput("");
    }
    document.addEventListener("pointerdown", handleClickOutside);
    return () =>
      document.removeEventListener("pointerdown", handleClickOutside);
  }, [open]);

  function submit() {
    const trimmed = input.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    closeDropdown();
  }

  function handleKeyDown(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      submit();
    } else if (event.key === "Escape") {
      closeDropdown();
    }
  }

  const clonedTrigger = cloneElement(trigger, {
    ref: triggerRef,
    "aria-expanded": open,
    "aria-controls": "popover-input-dropdown",
    onClick: (event) => {
      trigger.props.onClick?.(event);
      setOpen((value) => !value);
    },
  });

  return (
    <div
      ref={dropdownRef}
      className={`dropdown dropdown-end ${open ? "dropdown-open" : ""}`}
    >
      {clonedTrigger}
      {open && (
        <div
          id="popover-input-dropdown"
          className="dropdown-content z-[1] bg-base-200 rounded-box p-3 w-64 shadow"
        >
          <label className="form-control w-full">
            <span className="label-text">{label}</span>
            <input
              ref={inputRef}
              className="input input-sm"
              value={input}
              onChange={(event) => setInput(event.target.value)}
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
              disabled={!input.trim()}
              onClick={submit}
            >
              {submitLabel}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(PopoverInput);
