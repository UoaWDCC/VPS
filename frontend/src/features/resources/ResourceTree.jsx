import React from "react";

function NewBadge() {
  return <span className="badge badge-xs badge-neutral shrink-0">New</span>;
}

export default function ResourceTree({
  tree,
  unseenIds,
  selectedResourceId,
  onSelect,
}) {
  const unseen = new Set(unseenIds);

  return (
    <>
      {tree.map((resource) => (
        <li key={resource._id} className="overflow-hidden">
          {resource.type === "collection" ? (
            <details className="overflow-hidden">
              <summary className="flex items-center h-9">
                <span className="text--1 truncate flex-1" title={resource.name}>
                  {resource.name}
                </span>
                {resource.children.some((child) => unseen.has(child._id)) && (
                  <NewBadge />
                )}
              </summary>

              <ul className="overflow-hidden">
                {resource.children.length === 0 && (
                  <li className="opacity-60 p-2">No files yet</li>
                )}
                {resource.children.map((child) => (
                  <li key={child._id} className="overflow-hidden">
                    <div
                      className={`flex p-0 gap-0 ${selectedResourceId === child._id ? "bg-base-content/5" : ""}`}
                    >
                      <button
                        type="button"
                        className="flex items-center gap-2 min-w-0 text-left text--1 border-none cursor-pointer flex-1 px-3 py-1.5 h-9"
                        title={child.name}
                        onClick={() => onSelect(child._id)}
                      >
                        <span className="truncate flex-1">{child.name}</span>
                        {unseen.has(child._id) && <NewBadge />}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </details>
          ) : (
            <div
              className={`flex p-0 gap-0 ${selectedResourceId === resource._id ? "bg-base-content/5" : ""}`}
            >
              <button
                type="button"
                className="flex items-center gap-2 min-w-0 text-left text--1 border-none cursor-pointer flex-1 px-3 py-1.5 h-9"
                title={resource.name}
                onClick={() => onSelect(resource._id)}
              >
                <span className="truncate flex-1">{resource.name}</span>
                {unseen.has(resource._id) && <NewBadge />}
              </button>
            </div>
          )}
        </li>
      ))}
    </>
  );
}
