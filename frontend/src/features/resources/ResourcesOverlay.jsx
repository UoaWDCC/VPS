import React, { useEffect, useState } from "react";
import ResourceTree from "./ResourceTree";
import { FileTextIcon, SearchIcon, XIcon } from "lucide-react";
import { useResources } from "./useResources";
import { findById } from "../../util/search";
import { buildResourceTree, filterTreeBySearch, normaliseFile } from "./util";
import { filterTreeByConditions } from "../../utils/propertyConditionalEvaluator";
import SkeletonBody from "./ResourcesSkeleton";
import ResourcePreview from "./ResourcePreview";

// NOTE: property filters can't change while the resources panel is
// open, so deselecting on resource hiding isn't a concern

export default function ResourcesOverlay({ properties, open, onClose }) {
  const { resourcesQuery } = useResources();

  const [selectedResourceId, setSelectedResourceId] = useState(null);
  const [search, setSearch] = useState("");

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const { data, isLoading, isError, error } = resourcesQuery;

  const foundResource = findById(data, selectedResourceId);
  const selectedResource = foundResource ? normaliseFile(foundResource) : null;

  // NOTE: the filtering by properties should ideally be done on the
  // server to prevent cheating, but here we filter before rendering

  const resourceTree = buildResourceTree(data ?? []);
  const conditionFilteredTree = filterTreeByConditions(
    resourceTree,
    properties
  );
  const filteredTree = filterTreeBySearch(conditionFilteredTree, search);

  return (
    <>
      {/* overlay */}
      <div
        className={`fixed inset-0 z-50 bg-base-100/95 transition-opacity ${
          open
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        aria-hidden="true"
      />

      <div
        className={`fixed inset-0 z-50 flex items-center justify-center transition-all ${
          open
            ? "opacity-100 scale-100 pointer-events-auto"
            : "opacity-0 scale-95 pointer-events-none"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Resources"
        aria-hidden={!open}
        inert={!open ? "" : undefined}
        onClick={onClose}
      >
        <button
          className="absolute top-l left-xl bg-transparent border-none p-2 cursor-pointer z-10"
          onClick={onClose}
          aria-label="Close"
        >
          <XIcon size={32} />
        </button>
        <div
          className="relative h-dvh w-full overflow-hidden font-ibm shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="u-container h-full w-full overflow-y-auto py-l lg:overflow-hidden lg:pt-4xl">
            {isLoading ? (
              <SkeletonBody />
            ) : isError ? (
              <div className="flex h-full flex-col items-center justify-center gap-3">
                <div className="alert alert-error max-w-md">
                  <span>{error.message}</span>
                </div>
              </div>
            ) : !conditionFilteredTree?.length ? (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <p>
                    There are no resources currently available. Check back later
                    after making progression.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid min-h-full grid-cols-1 gap-3 lg:h-full lg:min-h-0 lg:grid-cols-3">
                {/* left */}
                <div className="min-h-[35dvh] min-w-0 overflow-hidden lg:h-full lg:min-h-0">
                  <div className="flex min-h-0 flex-col gap-4 px-0">
                    <h1 className="text-xl">Resources</h1>

                    <div className="flex items-center gap-4">
                      <label className="input search search-xs flex-grow bg-transparent">
                        <input
                          type="search"
                          placeholder="Search files and collections"
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                        />
                        <SearchIcon size={20} />
                      </label>
                    </div>

                    <ul className="menu min-h-0 w-full flex-1 overflow-auto p-0">
                      {search.trim() && filteredTree.length === 0 && (
                        <li className="p-2 opacity-60">
                          No matching resources found.
                        </li>
                      )}
                      <ResourceTree
                        tree={filteredTree}
                        selectedResourceId={selectedResourceId}
                        setSelectedResourceId={setSelectedResourceId}
                      />
                    </ul>
                  </div>
                </div>

                {/* right */}
                <div className="card min-h-[60dvh] overflow-auto pb-[max(1rem,env(safe-area-inset-bottom))] lg:col-span-2 lg:h-full lg:min-h-0">
                  <div className="pl-8 flex min-h-full flex-col gap-4">
                    {selectedResource ? (
                      selectedResource?.type === "file" && (
                        <div className="min-h-[50dvh] flex-1 lg:min-h-0">
                          <ResourcePreview file={selectedResource} />
                        </div>
                      )
                    ) : (
                      <div className="min-h-[50dvh] flex flex-1 flex-col gap-4 lg:min-h-0 justify-center items-center border border-primary rounded-xl">
                        <FileTextIcon size={32} />
                        <span className="text--1">
                          Select a resource to show the preview
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
