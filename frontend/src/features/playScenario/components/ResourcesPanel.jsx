import React, { useContext, useEffect, useState } from "react";
import ResourceTree from "./ResourceTree";
import {
  ListChevronsDownUpIcon,
  ListChevronsUpDownIcon,
  XIcon,
} from "lucide-react";
import { filterTreeByConditions } from "../../../utils/stateConditionalEvaluator";
import { normaliseFile } from "../../resources/util";
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
  const [selectedFile, setSelectedFile] = useState(null);
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
    queryKey: ["resources", scenarioId, stateVariables],
    queryFn: () => getResources(user, scenarioId),
  });

  const resourceTree = buildResourceTree(data ?? []);

  // Filtered tree for search
  const filteredTree = (() => {
    const filtered = filterTreeByConditions(resourceTree, stateVariables);

    const q = search.trim()?.toLowerCase();
    if (!q) return filtered;

    // NOTE: the filtering by state variables should ideally be done on the server to prevent cheating, but here we filter before rendering

    return filterTreeByConditions(resourceTree, stateVariables)
      .map((g) => {
        const matchingFiles = (g.children || []).filter((f) => {
          const inName = f.name.toLowerCase().includes(q);
          const inPath = g.name.toLowerCase().includes(q);
          return inName || inPath;
        });
        if (matchingFiles.length === 0) return null;
        return { ...g, children: matchingFiles };
      })
      .filter(Boolean);
  })();

  function handleSelectFile(file) {
    setSelectedFile(file);
  }

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
        className={`fixed inset-0 z-50 bg-black/90 transition-opacity ${
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
          className="shadow-2xl w-full h-full overflow-hidden font-ibm"
          onClick={stopPropagation}
        >
          <div className="u-container w-full pt-4xl">
            <div className="flex justify-between items-center mb-l">
              <h1 className="text-xl">Resources </h1>
              <button
                className="btn btn-phantom btn-sm"
                onClick={onClose}
                aria-label="Close"
              >
                <XIcon size={32} />
              </button>
            </div>
            {/* Search */}
            <div className="p-3">
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  className="flex-1 outline-none pb-3 border-0 border-b-1 border-primary"
                  placeholder="Search files or group name"
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
            </div>
            <div className="p-3 h-[calc(100%-112px)] overflow-hidden">
              {isLoading ? (
                <SkeletonBody />
              ) : isError ? (
                <div className="h-full flex flex-col items-center justify-center gap-3">
                  <div className="alert alert-error max-w-md">
                    <span>{error.text}</span>
                  </div>
                </div>
              ) : (filteredTree?.length ?? 0) === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center opacity-70">
                    <p>No resources available for this scenario.</p>
                    <p className="text-sm">
                      Ask the author to upload files in the authoring UI.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 h-full">
                  <div className="overflow-auto rounded-lg">
                    <ResourceTree
                      tree={filteredTree}
                      search={search}
                      onSelectFile={handleSelectFile}
                      selectedFileId={selectedFile?._id}
                      openGroups={openGroups}
                      toggleGroup={toggleGroup}
                    />
                  </div>
                  <div className="col-span-2 overflow-auto rounded-lg">
                    <ResourcePreview file={selectedFile} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
