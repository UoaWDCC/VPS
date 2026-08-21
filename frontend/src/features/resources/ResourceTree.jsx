import React from "react";

export default function ResourceTree({
  tree,
  selectedResourceId,
  setSelectedResourceId,
}) {
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
                        className="min-w-0 truncate px-0 text-left text--1 border-none cursor-pointer flex-1 px-3 py-1.5 h-9"
                        title={child.name}
                        onClick={() => setSelectedResourceId(child._id)}
                      >
                        {child.name}
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
                className="min-w-0 truncate px-0 text-left text--1 border-none cursor-pointer flex-1 px-3 py-1.5 h-9"
                title={resource.name}
                onClick={() => setSelectedResourceId(resource._id)}
              >
                {resource.name}
              </button>
            </div>
          )}
        </li>
      ))}
    </>
  );
}
