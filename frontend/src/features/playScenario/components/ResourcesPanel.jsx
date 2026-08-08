import React, { useEffect, useMemo, useRef, useState } from "react";
import { getAuth } from "firebase/auth";
import axios from "axios";
import toast from "react-hot-toast";
import ResourceTree from "./ResourceTree";
import ResourcePreview from "./ResourcePreview";
import {
  ListChevronsDownUpIcon,
  ListChevronsUpDownIcon,
  XIcon,
} from "lucide-react";
import { filterTreeByConditions } from "../../../utils/stateConditionalEvaluator";
import { normaliseFile } from "../../resources/util";

export default function ResourcesPanel({
  scenarioId,
  stateVariables,
  open,
  onClose,
}) {
  const [loading, setLoading] = useState(false);
  const [tree, setTree] = useState([]);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [selectedFileId, setSelectedFileId] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  // Expanded groups
  const [openGroups, setOpenGroups] = useState(() => new Set());
  const dialogRef = useRef(null);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  async function fetchTree() {
    try {
      setLoading(true);
      setError(null);
      const user = getAuth().currentUser;
      if (!user) {
        toast.error("You must be logged in to view resources.");
        setLoading(false);
        return;
      }
      const idToken = await user.getIdToken();
      const { data } = await axios.get(`/api/collections/tree/${scenarioId}`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });

      // ✅ Normalized: groups → files
      const normalized =
        (data || []).map((g) => ({
          id: g._id,
          name: g.name,
          order: g.order ?? 0,
          stateConditionals: g.stateConditionals || [],
          files: (g.files || []).map(normaliseFile),
        })) || [];

      const filteredTree = filterTreeByConditions(normalized, stateVariables);

      setTree(filteredTree);
      setLoading(false);

      if (selectedFileId) {
        const f = findFileById(filteredTree, selectedFileId);
        setSelectedFile(f || null);
      }
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.error || err.message || "Failed to load resources"
      );
      toast.error("Failed to load resources");
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open && scenarioId) fetchTree();
  }, [open, scenarioId, stateVariables]);

  // Filtered tree for search
  const filteredTree = useMemo(() => {
    if (!search.trim()) return tree;
    const q = search.trim().toLowerCase();
    return tree
      .map((g) => {
        const matchingFiles = (g.files || []).filter((f) => {
          const inName = f.name.toLowerCase().includes(q);
          const inPath = g.name.toLowerCase().includes(q);
          return inName || inPath;
        });
        if (matchingFiles.length === 0) return null;
        return { ...g, files: matchingFiles };
      })
      .filter(Boolean);
  }, [tree, search]);

  function handleSelectFile(file) {
    setSelectedFileId(file?.id || null);
    setSelectedFile(file || null);
  }

  function handleRetry() {
    fetchTree();
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
    const allGroups = new Set(tree.map((g) => g.id));
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
          ref={dialogRef}
          className="relative h-dvh w-full overflow-hidden font-ibm shadow-2xl"
          onClick={stopPropagation}
        >
          <div className="u-container h-full w-full overflow-y-auto py-l lg:overflow-hidden lg:py-4xl">
            <div className="grid min-h-full grid-cols-1 gap-3 lg:h-full lg:min-h-0 lg:grid-cols-3">
              <div className="flex min-h-[35dvh] flex-col lg:min-h-0">
                <h1 className="mb-l pr-3xl text-xl">Resources</h1>

                <div className="mb-2 flex flex-none gap-2 py-3">
                  <label htmlFor="resource-search" className="sr-only">
                    Search files or collection name
                  </label>
                  <input
                    id="resource-search"
                    type="search"
                    className="flex-1 border-0 border-b-1 border-primary pb-3 outline-none"
                    placeholder="Search files or collection name"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <button
                    className="btn btn-phantom btn-sm"
                    onClick={expandAll}
                    title="Expand all"
                    disabled={loading || !tree.length}
                  >
                    <ListChevronsDownUpIcon size={20} />
                  </button>
                  <button
                    className="btn btn-phantom btn-sm"
                    onClick={collapseAll}
                    title="Collapse all"
                    disabled={loading || !tree.length}
                  >
                    <ListChevronsUpDownIcon size={20} />
                  </button>
                </div>

                <div className="min-h-0 flex-1 overflow-auto rounded-lg py-3">
                  {loading ? (
                    <TreeSkeleton />
                  ) : error ? (
                    <div className="flex h-full flex-col items-center justify-center gap-3">
                      <div className="alert alert-error max-w-md">
                        <span>{error}</span>
                      </div>
                      <button className="btn btn-sm" onClick={handleRetry}>
                        Retry
                      </button>
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
                      onSelectFile={handleSelectFile}
                      selectedFileId={selectedFileId}
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
                  <ResourcePreview file={selectedFile} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function TreeSkeleton() {
  return (
    <div className="space-y-2">
      <div className="skeleton h-5 w-1/2" />
      <div className="skeleton h-4 w-2/3" />
      <div className="skeleton h-4 w-3/5" />
      <div className="skeleton h-4 w-1/2" />
      <div className="skeleton h-4 w-2/3" />
    </div>
  );
}

function findFileById(tree, id) {
  for (const g of tree) {
    for (const f of g.files || []) {
      if (f.id === id)
        return {
          ...f,
          groupId: g.id,
          groupName: g.name,
        };
    }
  }
  return null;
}
