import React, { useEffect, useMemo, useRef, useState } from "react";
import { getAuth } from "firebase/auth";
import axios from "axios";
import toast from "react-hot-toast";
import ResourceTree from "./ResourceTree";
import ResourcePreview from "./ResourcePreview";
import { getDownloadUrl } from "../hooks/useDownloadUrl";

export default function ResourcesPanel({ scenarioId, open, onClose }) {
  const [loading, setLoading] = useState(false);
  const [tree, setTree] = useState([]);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [selectedFileId, setSelectedFileId] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  // Expanded state for tree persistence
  const [openGroups, setOpenGroups] = useState(() => new Set());
  const [openChildren, setOpenChildren] = useState(() => new Set());

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

  // Fetch tree when opened or scenario changes
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

      const normalized =
        (data || []).map((g) => ({
          id: g._id,
          name: g.name,
          order: g.order ?? 0,
          children: (g.children || []).map((c) => ({
            id: c._id,
            name: c.name,
            order: c.order ?? 0,
            files: (c.files || []).map((f) => ({
              id: f._id,
              name: f.name,
              size: f.size,
              type: f.type,
              createdAt: f.createdAt,
            })),
          })),
        })) || [];

      setTree(normalized);
      setLoading(false);

      if (selectedFileId) {
        const f = findFileById(normalized, selectedFileId);
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
  }, [open, scenarioId]);

  // Filtered tree for search
  const filteredTree = useMemo(() => {
    if (!search.trim()) return tree;
    const q = search.trim().toLowerCase();
    return tree
      .map((g) => {
        const matchingChildren = (g.children || [])
          .map((c) => {
            const files = (c.files || []).filter((f) => {
              const inName = f.name.toLowerCase().includes(q);
              const inPath = `${g.name}/${c.name}`.toLowerCase().includes(q);
              return inName || inPath;
            });
            if (files.length === 0) return null;
            return { ...c, files };
          })
          .filter(Boolean);
        if (matchingChildren.length === 0) return null;
        return { ...g, children: matchingChildren };
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

  const toggleChild = (cid) => {
    setOpenChildren((prev) => {
      const next = new Set(prev);
      if (next.has(cid)) next.delete(cid);
      else next.add(cid);
      return next;
    });
  };

  const expandAll = () => {
    const allGroups = new Set(tree.map((g) => g.id));
    const allChildren = new Set(
      tree.flatMap((g) => (g.children || []).map((c) => c.id))
    );
    setOpenGroups(allGroups);
    setOpenChildren(allChildren);
  };

  const collapseAll = () => {
    setOpenGroups(new Set());
    setOpenChildren(new Set());
  };

  // Prevent closing when clicking inside the dialog
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
          ref={dialogRef}
          className="shadow-2xl w-full h-full overflow-hidden"
          onClick={stopPropagation}
        >
          <div className="sticky top-0 z-10 bg-base-100 border-b border-base-300 p-3 flex items-center gap-2">
            <h2 className="text-lg font-semibold flex-1">Resources</h2>
            <button
              className="btn btn-ghost btn-sm"
              onClick={onClose}
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          {/* Search */}
          <div className="p-3 border-b border-base-200">
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                className="input input-bordered input-sm flex-1"
                placeholder="Search files or path (e.g. 'design/wireframes')"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button
                className="btn btn-ghost btn-sm"
                onClick={expandAll}
                title="Expand all"
                disabled={loading || !tree.length}
              >
                ⬇
              </button>
              <button
                className="btn btn-ghost btn-sm"
                onClick={collapseAll}
                title="Collapse all"
                disabled={loading || !tree.length}
              >
                ⬆
              </button>
            </div>
          </div>
          <div className="p-3 h-[calc(100%-112px)] overflow-hidden">
            {loading ? (
              <SkeletonBody />
            ) : error ? (
              <div className="h-full flex flex-col items-center justify-center gap-3">
                <div className="alert alert-error max-w-md">
                  <span>{error}</span>
                </div>
                <button className="btn btn-sm" onClick={handleRetry}>
                  Retry
                </button>
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 h-full">
                <div className="overflow-auto border border-base-200 rounded-lg">
                  <ResourceTree
                    tree={filteredTree}
                    search={search}
                    onSelectFile={handleSelectFile}
                    selectedFileId={selectedFileId}
                    openGroups={openGroups}
                    openChildren={openChildren}
                    toggleGroup={toggleGroup}
                    toggleChild={toggleChild}
                  />
                </div>
                <div className="overflow-auto border border-base-200 rounded-lg">
                  <ResourcePreview
                    file={selectedFile}
                    getDownloadUrl={getDownloadUrl}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function SkeletonBody() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 h-full">
      <div className="space-y-2">
        <div className="skeleton h-5 w-1/2" />
        <div className="skeleton h-4 w-2/3" />
        <div className="skeleton h-4 w-3/5" />
        <div className="skeleton h-4 w-1/2" />
        <div className="skeleton h-4 w-2/3" />
      </div>
      <div className="space-y-2">
        <div className="skeleton h-6 w-3/4" />
        <div className="skeleton h-48 w-full" />
        <div className="skeleton h-4 w-1/3" />
      </div>
    </div>
  );
}

function findFileById(tree, id) {
  for (const g of tree) {
    for (const c of g.children || []) {
      for (const f of c.files || []) {
        if (f.id === id)
          return {
            ...f,
            groupId: g.id,
            groupName: g.name,
            childId: c.id,
            childName: c.name,
          };
      }
    }
  }
  return null;
}
