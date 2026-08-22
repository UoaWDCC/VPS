import { useEffect, useRef, useState } from "react";
import { CheckIcon, PencilIcon } from "lucide-react";
import { isTemp } from "../util";

const RESOURCE_NAME_MAX_LENGTH = 255;

export default function ResourceNameField({
  resource,
  disabled,
  onSelect,
  isSelected,
  onRename,
  actions,
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(resource.name);
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
    }
  }, [editing]);

  function startEditing(e) {
    e.stopPropagation();
    if (disabled) return;
    setValue(resource.name);
    setEditing(true);
  }

  function commitEdit() {
    setEditing(false);
    const trimmedName = value.trim();
    if (!trimmedName || trimmedName === resource.name) return;
    onRename(trimmedName);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      inputRef.current?.blur();
    } else if (e.key === "Escape") {
      setValue(resource.name);
      setEditing(false);
    }
  }

  const rowStyle = editing
    ? {
        gridTemplateColumns: "minmax(0, 1fr) auto",
        backgroundColor: "transparent",
        boxShadow: "none",
        color: "var(--color-base-content)",
        cursor: "auto",
      }
    : { gridTemplateColumns: "minmax(0, 1fr) auto auto" };

  return (
    <div
      className={`grid items-center overflow-hidden p-0 gap-0 ${isSelected ? "bg-base-content/5" : ""}`}
      style={rowStyle}
    >
      {editing ? (
        <input
          ref={inputRef}
          type="text"
          aria-label={`Rename ${resource.name}`}
          className="input input-bordered min-w-0 h-9"
          style={{
            "--input-color":
              "color-mix(in oklab, var(--color-base-content) 20%, transparent)",
            backgroundColor: "var(--color-base-100)",
            borderColor:
              "color-mix(in oklab, var(--color-base-content) 20%, transparent)",
            color: "var(--color-base-content)",
            boxShadow: "none",
            outline: "none",
            userSelect: "text",
            WebkitUserSelect: "text",
          }}
          value={value}
          maxLength={RESOURCE_NAME_MAX_LENGTH}
          onChange={(e) => setValue(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={handleKeyDown}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <>
          <button
            type="button"
            className={`min-w-0 truncate bg-transparent text-left text--1 border-none cursor-pointer disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary px-3 py-1.5 h-9 ${isTemp(resource) ? "text-primary" : ""}`}
            title={resource.name}
            onClick={onSelect}
            disabled={disabled}
          >
            {resource.name}
          </button>
          <button
            type="button"
            className="btn btn-phantom btn-xs px-1.5 h-full"
            onClick={startEditing}
            title="Rename"
            disabled={disabled}
          >
            <PencilIcon size={14} />
          </button>
        </>
      )}
      {editing ? (
        <button
          type="button"
          className="btn btn-phantom btn-xs px-1.5 h-full"
          onClick={() => inputRef.current?.blur()}
          title="Confirm rename"
        >
          <CheckIcon size={14} />
        </button>
      ) : (
        actions
      )}
    </div>
  );
}
