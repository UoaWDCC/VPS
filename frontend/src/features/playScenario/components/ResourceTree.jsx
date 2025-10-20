import React, { useEffect } from "react";

export default function ResourceTree({
  tree,
  search,
  onSelectFile,
  selectedFileId,
  openGroups,
  toggleGroup,
}) {
  // Automatically expand all groups when searching
  useEffect(() => {
    if (search.trim()) {
      const allG = new Set(tree.map((g) => g.id));
      allG.forEach((gid) => !openGroups.has(gid) && toggleGroup(gid));
    }
  }, [search, tree, openGroups, toggleGroup]);

  return (
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
              {(group.files || []).length}{" "}
              {openGroups.has(group.id) ? "▾" : "▸"}
            </span>
          </button>

          {openGroups.has(group.id) && (
            <ul className="ml-3">
              {(group.files || []).map((f) => (
                <li key={f.id}>
                  <button
                    className={`flex w-full items-center justify-between px-2 py-1 rounded hover:bg-base-200 text-left ${selectedFileId === f.id ? "bg-base-200" : ""
                      }`}
                    onClick={() =>
                      onSelectFile({
                        ...f,
                        groupId: group.id,
                        groupName: group.name,
                      })
                    }
                    title={`${group.name}/${f.name}`}
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
