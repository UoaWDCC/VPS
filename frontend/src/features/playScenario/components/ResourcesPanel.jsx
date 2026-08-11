import React, { useContext, useEffect, useState } from "react";
import ResourceTree from "./ResourceTree";
import {
  ListChevronsDownUpIcon,
  ListChevronsUpDownIcon,
  XIcon,
} from "lucide-react";
import { filterTreeByConditions } from "../../../utils/stateConditionalEvaluator";
import { filterTreeBySearch, normaliseFile } from "../../resources/util";
import { api } from "../../../util/api";
import { useQuery } from "@tanstack/react-query";
import AuthenticationContext from "../../../context/AuthenticationContext";
import ResourcePreview from "../../resources/ResourcePreview";
import SkeletonBody from "../../resources/ResourcesSkeleton";

function buildResourceTree(resources) {
  const collections = resources.filter((r) => r.type === "collection");
  const files = resources.filter((r) => r.type === "file").map(normaliseFile);

  const grouped = collections.map((collection) => ({
    _id: collection._id,
    name: collection.name,
    type: "collection",
    stateConditionals: collection.stateConditionals,
    children: files.filter(
      (f) => String(f.parentId) === String(collection._id)
    ),
  }));

  const orphanFiles = files.filter((f) => !f.parentId);

  return [...grouped, ...orphanFiles];
}

async function getResources(user, scenarioId) {
  const res = await api.get(user, `/api/resources/${scenarioId}`);
  return res.data;
}

export default function ResourcesPanel({
  scenarioId,
  stateVariables,
  open,
  onClose,
}) {
  const { user } = useContext(AuthenticationContext);

  const [search, setSearch] = useState("");
  const [selectedResourceId, setSelectedResourceId] = useState(null);
  const [openGroups, setOpenGroups] = useState(() => new Set());

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["resources", scenarioId, user],
    queryFn: () => getResources(user, scenarioId),
  });

  // NOTE: state variable filters can't change while the resources panel is
  // open, so deselecting on resource hiding isn't a concern
  const foundResource = data?.find((r) => r._id === selectedResourceId);
  const selectedResource = foundResource ? normaliseFile(foundResource) : null;

  const resourceTree = buildResourceTree(data ?? []);
  // NOTE: the filtering by state variables should ideally be done on the
  // server to prevent cheating, but here we filter before rendering
  const filteredTree = (() => {
    const filtered = filterTreeByConditions(resourceTree, stateVariables);
    return filterTreeBySearch(filtered, search);
  })();

  const toggleGroup = (gid) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(gid)) next.delete(gid);
      else next.add(gid);
      return next;
    });
  };

  const expandAll = () => {
    const allGroups = new Set(resourceTree.map((g) => g._id));
    setOpenGroups(allGroups);
  };

  const collapseAll = () => {
    setOpenGroups(new Set());
  };

  const stopPropagation = (e) => e.stopPropagation();

  return (
    <>
      <div
        className={`fixed inset-0 z-50 bg-base-100/95 transition-opacity ${
          open
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
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
        onClick={onClose}
      >
        <div
          className="relative h-dvh w-full overflow-hidden font-ibm shadow-2xl"
          onClick={stopPropagation}
        >
          <div className="u-container h-full w-full overflow-y-auto py-l lg:overflow-hidden lg:py-4xl">
            <div className="grid min-h-full grid-cols-1 gap-3 lg:h-full lg:min-h-0 lg:grid-cols-3">
              <div className="flex min-h-[35dvh] flex-col lg:min-h-0">
                <h1 className="mb-l pr-3xl text-xl">Resources</h1>

                <div className="mb-2 flex flex-none gap-2 py-3">
                  <label htmlFor="resource-search" className="sr-only">
                    Search files and collections
                  </label>
                  <input
                    id="resource-search"
                    type="search"
                    className="flex-1 border-0 border-b-1 border-primary pb-3 outline-none"
                    placeholder="Search files and collections"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <button
                    className="btn btn-phantom btn-sm"
                    onClick={expandAll}
                    title="Expand all"
                    disabled={isLoading || !resourceTree.length}
                  >
                    <ListChevronsDownUpIcon size={20} />
                  </button>
                  <button
                    className="btn btn-phantom btn-sm"
                    onClick={collapseAll}
                    title="Collapse all"
                    disabled={isLoading || !resourceTree.length}
                  >
                    <ListChevronsUpDownIcon size={20} />
                  </button>
                </div>

                <div className="min-h-0 flex-1 overflow-auto rounded-lg py-3">
                  {isLoading ? (
                    <SkeletonBody />
                  ) : isError ? (
                    <div className="flex h-full flex-col items-center justify-center gap-3">
                      <div className="alert alert-error max-w-md">
                        <span>{error.message}</span>
                      </div>
                    </div>
                  ) : (filteredTree?.length ?? 0) === 0 ? (
                    <div className="flex h-full items-center justify-center">
                      <div className="text-center opacity-70">
                        {search.trim() ? (
                          <p>No matching resources found.</p>
                        ) : (
                          <>
                            <p>No resources available for this scenario.</p>
                            <p className="text-sm">
                              Ask the author to upload files in the authoring
                              UI.
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    <ResourceTree
                      tree={filteredTree}
                      search={search}
                      onSelectFile={(r) => setSelectedResourceId(r._id)}
                      selectedFileId={selectedResource?._id}
                      openGroups={openGroups}
                      toggleGroup={toggleGroup}
                    />
                  )}
                </div>
              </div>

              <div className="relative min-h-[60dvh] rounded-lg lg:col-span-2 lg:min-h-0">
                <button
                  className="btn btn-phantom btn-sm absolute right-3 top-2 z-10"
                  onClick={onClose}
                  aria-label="Close"
                >
                  <XIcon size={32} />
                </button>
                <div className="h-full overflow-auto pb-[max(1rem,env(safe-area-inset-bottom))]">
                  <ResourcePreview file={selectedResource} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
