import React, { useEffect, useMemo } from "react";

export default function ResourceTree({
  tree,
  search,
  onSelectFile,
  selectedFileId,
  openGroups,
  openChildren,
  toggleGroup,
  toggleChild,
}) {
  // Automatically expand when searching
  useEffect(() => {
    if (search.trim()) {
      const allG = new Set(tree.map((g) => g.id));
      const allC = new Set(
        tree.flatMap((g) => (g.children || []).map((c) => c.id))
      );
      // Update parent state when auto-expanding for search
      allG.forEach((gid) => !openGroups.has(gid) && toggleGroup(gid));
      allC.forEach((cid) => !openChildren.has(cid) && toggleChild(cid));
    }
  }, [search, tree, openGroups, openChildren, toggleGroup, toggleChild]);

  const totalFiles = useMemo(
    () =>
      tree.reduce(
        (sum, g) =>
          sum +
          (g.children || []).reduce((s, c) => s + (c.files || []).length, 0),
        0
      ),
    [tree]
  );

  return (
    <div className="p-2">
      <div className="px-2 pb-2 text-xs opacity-70">
        {totalFiles} file{totalFiles !== 1 ? "s" : ""}
      </div>
      <ul className="menu w-full">
        {tree.map((group) => (
          <li key={group.id} className="mb-1">
            <button
              className="flex items-center justify-between px-2 py-1 rounded hover:bg-base-200 focus:outline-none"
              onClick={() => toggleGroup(group.id)}
              aria-expanded={openGroups.has(group.id)}
            >
              <span className="font-medium truncate">{group.name}</span>
              <span className="text-xs opacity-70">
                {openGroups.has(group.id) ? "▾" : "▸"}
              </span>
            </button>

            {openGroups.has(group.id) && (
              <ul className="ml-3 border-l border-base-300">
                {(group.children || []).map((child) => (
                  <li key={child.id} className="py-1">
                    <button
                      className="flex items-center justify-between px-2 py-1 rounded hover:bg-base-200 focus:outline-none"
                      onClick={() => toggleChild(child.id)}
                      aria-expanded={openChildren.has(child.id)}
                    >
                      <span className="truncate">{child.name}</span>
                      <span className="text-xs opacity-70">
                        {(child.files || []).length}{" "}
                        {openChildren.has(child.id) ? "▾" : "▸"}
                      </span>
                    </button>

                    {openChildren.has(child.id) && (
                      <ul className="ml-3 border-l border-base-300">
                        {(child.files || []).map((f) => (
                          <li key={f.id}>
                            <button
                              className={`flex w-full items-center justify-between px-2 py-1 rounded hover:bg-base-200 text-left ${
                                selectedFileId === f.id ? "bg-base-200" : ""
                              }`}
                              onClick={() =>
                                onSelectFile({
                                  ...f,
                                  groupId: group.id,
                                  groupName: group.name,
                                  childId: child.id,
                                  childName: child.name,
                                })
                              }
                              title={`${group.name}/${child.name}/${f.name}`}
                            >
                              <span className="truncate">{f.name}</span>
                              <span className="text-[10px] opacity-60 ml-2 whitespace-nowrap">
                                {formatBytes(f.size)} · {shortType(f.type)}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function shortType(t) {
  if (!t) return "-";
  if (t.startsWith("image/")) return "image";
  if (t.startsWith("text/")) return "text";
  if (/json/.test(t)) return "json";
  if (/csv/.test(t)) return "csv";
  if (/pdf/.test(t)) return "pdf";
  return t.split("/").pop();
}

function formatBytes(n) {
  if (!Number.isFinite(n)) return "-";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  if (n < k) return `${n} B`;
  const i = Math.floor(Math.log(n) / Math.log(k));
  return `${(n / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}
