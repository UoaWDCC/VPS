import React from "react";

export default function ResourceTree({
  tree,
  selectedResourceId,
  setSelectedResourceId,
}) {
  return (
    <ul className="menu w-full p-0">
      {tree.map((resource) => (
        <li key={resource._id} className="overflow-hidden">
          {resource.type === "collection" ? (
            <details className="overflow-hidden">
              <summary
                className={`flex items-center ${selectedResourceId === resource._id ? "bg-base-200" : ""}`}
              >
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
                    <div>
                      <button
                        type="button"
                        className={`min-w-0 truncate bg-transparent px-0 text-left text--1 border-none cursor-pointer ${selectedResourceId === resource._id ? "bg-base-200" : ""}`}
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
            <div>
              <button
                type="button"
                className={`min-w-0 truncate bg-transparent px-0 text-left text--1 border-none cursor-pointer ${selectedResourceId === resource._id ? "bg-base-200" : ""}`}
                title={resource.name}
                onClick={() => setSelectedResourceId(resource._id)}
              >
                {resource.name}
              </button>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
