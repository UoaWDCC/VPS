import { useEffect, useRef, useState } from "react";
import { CheckIcon, PencilIcon } from "lucide-react";
import { RESOURCE_NAME_MAX_LENGTH } from "../constants";
import { useResources } from "../useResources";
import toast from "react-hot-toast";

function downloadFilename(name, extension) {
  const trimmed = name?.trim() || "";
  if (!extension || trimmed.toLowerCase().endsWith(extension)) return trimmed;
  return `${trimmed}${extension}`;
}

async function downloadFile(url, name, extension) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`failed to load file (${res.status})`);
  const blob = await res.blob();
  const blobUrl = window.URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = downloadFilename(name, extension);
  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  window.URL.revokeObjectURL(blobUrl);
}

function fileTypeLabel(file) {
  if (file.extension) return file.extension.slice(1).toUpperCase();
  const subtype = file.contentType?.split("/")[1];
  return subtype ? subtype.toUpperCase() : null;
}

export default function ResourceTitle({ resource, editable }) {
  const { renameResourceMutation } = useResources();

  function renameResource(resource, name) {
    renameResourceMutation.mutate({ resourceId: resource._id, name });
  }

  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(resource.name);
  const inputRef = useRef(null);

  const typeLabel = resource?.type === "file" ? fileTypeLabel(resource) : "";

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
    }
  }, [editing]);

  function startEditing(e) {
    e.preventDefault();
    e.stopPropagation();
    setValue(resource.name);
    setEditing(true);
  }

  function commitEdit() {
    setEditing(false);
    const trimmedName = value.trim();
    if (!trimmedName || trimmedName === resource.name) return;
    renameResource(resource, trimmedName);
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

  return (
    <>
      <div className="flex items-center justify-between gap-2">
        {editing ? (
          <input
            ref={inputRef}
            type="text"
            aria-label={`Rename ${resource.name}`}
            className="input text-m input-bordered min-w-0 h-9 flex-1"
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
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h3 className="text-m min-w-0 break-all">{resource.name}</h3>
            {typeLabel && (
              <span
                className="badge badge-ghost badge-sm shrink-0"
                title={`File type: ${typeLabel}`}
              >
                {typeLabel}
              </span>
            )}
            {editable && (
              <button
                type="button"
                className="btn btn-phantom btn-xs px-1.5 h-9"
                onClick={startEditing}
                title="Rename"
              >
                <PencilIcon size={14} />
              </button>
            )}
          </div>
        )}{" "}
        {editing ?? (
          <button
            type="button"
            className="btn btn-phantom btn-xs px-1.5 h-9"
            onClick={() => inputRef.current?.blur()}
            title="Confirm rename"
          >
            <CheckIcon size={14} />
          </button>
        )}
        {resource?.type === "file" && (
          <button
            type="button"
            className="btn btn-phantom btn-xs shrink-0 "
            onClick={() =>
              downloadFile(
                resource.url,
                resource.name,
                resource.extension
              ).catch((err) => {
                console.error("Failed to download file:", err);
                toast.error("Failed to download file. Please try again.");
              })
            }
          >
            Download
          </button>
        )}
      </div>
    </>
  );
}
