import React, { useMemo, useRef, useState, useEffect } from "react";
import { getAuth } from "firebase/auth";
import axios from "axios";
import Papa from "papaparse";
import toast from "react-hot-toast";
import { useParams } from "react-router-dom";

// Your project components
import ScreenContainer from "../../components/ScreenContainer/ScreenContainer";
import TopBar from "../../components/TopBar/TopBar";

/**
 * ManageResourcesPage
 * - Keeps your existing header (TopBar)
 * - LEFT: nested DaisyUI dropdowns (collections → sub-items) with a + button to upload files into each
 * - RIGHT: searchable table + preview of files you uploaded via the left pane
 * - Also preserves your CSV bulk import flow into `resources` (shown below header for reference)
 */
export default function ManageResourcesPage() {
  const { scenarioId } = useParams();

  // ==== existing CSV import state ==== //
  const csvInputRef = useRef(null);
  const [resources, setResources] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) {
          toast.error("You must be logged in to view resources.");
          return;
        }
        const idToken = await user.getIdToken();
        const response = await fetch(
          `http://localhost:3000/api/resources/scenario/${scenarioId}`,
          {
            headers: { Authorization: `Bearer ${idToken}` },
          }
        );
        if (!response.ok)
          throw new Error(
            (await response.text()) || "Failed to fetch resources."
          );
        const data = await response.json();
        setResources(data);
      } catch (err) {
        toast.error(
          "Error fetching resources: " + (err?.message || String(err))
        );
      }
    })();
  }, [scenarioId]);

  const triggerCsvUpload = () => csvInputRef.current?.click();

  const handleCsvUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async ({ data }) => {
        try {
          const auth = getAuth();
          const user = auth.currentUser;
          if (!user) {
            toast.error("You must be logged in to upload.");
            return;
          }
          const idToken = await user.getIdToken();
          const res = await axios.post(`/api/resources/${scenarioId}`, data, {
            headers: { Authorization: `Bearer ${idToken}` },
          });
          console.log("Backend response:", res.data);
          toast.success(`Successfully uploaded ${data.length} resources!`);
          setResources((prev) => [...prev, ...data]);
        } catch (error) {
          const msg = error?.response?.data || error.message || "Unknown error";
          toast.error(`Error uploading: ${msg}`);
        } finally {
          event.target.value = ""; // reset input
        }
      },
    });
  };

  // ==== LEFT/RIGHT panes state for file uploads (client-side preview) ==== //
  function uid() {
    return Math.random().toString(36).slice(2, 9);
  }

  const [groups, setGroups] = useState(() => [
    {
      id: uid(),
      name: "Design Docs",
      children: [
        { id: uid(), name: "Wireframes", files: [] },
        { id: uid(), name: "Specs", files: [] },
      ],
    },
    {
      id: uid(),
      name: "Assets",
      children: [
        { id: uid(), name: "Logos", files: [] },
        { id: uid(), name: "Illustrations", files: [] },
      ],
    },
  ]);

  const [selectedFile, setSelectedFile] = useState(null);
  const [filter, setFilter] = useState("");

  const allFiles = useMemo(() => {
    const out = [];
    for (const g of groups) {
      for (const c of g.children) {
        for (const f of c.files)
          out.push({
            ...f,
            groupId: g.id,
            childId: c.id,
            groupName: g.name,
            childName: c.name,
          });
      }
    }
    return out;
  }, [groups]);

  const filteredFiles = useMemo(() => {
    if (!filter) return allFiles;
    const q = filter.toLowerCase();
    return allFiles.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        `${f.groupName}/${f.childName}`.toLowerCase().includes(q)
    );
  }, [allFiles, filter]);

  function addFilesTo(childId, files) {
    setGroups((prev) =>
      prev.map((g) => ({
        ...g,
        children: g.children.map((c) =>
          c.id === childId
            ? {
                ...c,
                files: [
                  ...c.files,
                  ...files.map((file) => ({
                    id: uid(),
                    name: file.name,
                    size: file.size,
                    type: file.type || "application/octet-stream",
                    url: URL.createObjectURL(file),
                    file,
                  })),
                ],
              }
            : c
        ),
      }))
    );
  }

  function removeFile(fileId) {
    setGroups((prev) =>
      prev.map((g) => ({
        ...g,
        children: g.children.map((c) => ({
          ...c,
          files: c.files.filter((f) => f.id !== fileId),
        })),
      }))
    );
    if (selectedFile?.id === fileId) setSelectedFile(null);
  }

  return (
    <ScreenContainer vertical>
      {/* ==== TopBar keeps your existing header area ==== */}
      <TopBar back={`/scenario/${scenarioId}`}>
        {/* CSV bulk importer (unchanged) */}
        <input
          type="file"
          ref={csvInputRef}
          accept=".csv"
          className="hidden"
          onChange={handleCsvUpload}
        />
        <button className="btn vps w-[100px]" onClick={triggerCsvUpload}>
          Upload CSV
        </button>
      </TopBar>

      {/* Existing resources from backend (kept for reference) */}
      <section className="p-4">
        <h2 className="text-xl font-semibold mb-2">Uploaded Resources</h2>
        {resources.length === 0 ? (
          <p className="opacity-70">No resources uploaded yet.</p>
        ) : (
          <div className="overflow-auto max-h-56 border rounded">
            {/* <table className="table table-zebra">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Resource</th>
                </tr>
              </thead>
              <tbody>
                {resources.map((r, i) => (
                  <tr key={i}>
                    <td className="w-10">{i + 1}</td>
                    <td className="text-xs">{JSON.stringify(r)}</td>
                  </tr>
                ))}
              </tbody>
            </table> */}
          </div>
        )}
      </section>

      {/* Two-pane layout */}
      <div className="container mx-auto p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* LEFT: Nested dropdowns with + to add files */}
        <div className="card bg-base-100 shadow-md">
          <div className="card-body gap-4">
            <div className="flex items-center justify-between">
              <h2 className="card-title">Collections</h2>
              <AddGroup
                onAdd={(name) =>
                  setGroups((g) => [...g, { id: uid(), name, children: [] }])
                }
              />
            </div>

            <ul className="menu bg-base-100 rounded-box w-full">
              {groups.map((group) => (
                <li key={group.id}>
                  <details>
                    <summary className="flex items-center gap-2">
                      <span className="font-medium">{group.name}</span>
                      <AddChild
                        onAdd={(name) =>
                          setGroups((prev) =>
                            prev.map((g) =>
                              g.id === group.id
                                ? {
                                    ...g,
                                    children: [
                                      ...g.children,
                                      { id: uid(), name, files: [] },
                                    ],
                                  }
                                : g
                            )
                          )
                        }
                      />
                    </summary>
                    <ul>
                      {group.children.length === 0 && (
                        <li className="opacity-60 p-2">No sub-items yet</li>
                      )}
                      {group.children.map((child) => (
                        <li key={child.id}>
                          <div className="flex items-center justify-between pr-2">
                            <span>{child.name}</span>
                            <UploadButton
                              onFiles={(files) => addFilesTo(child.id, files)}
                            />
                          </div>
                          {child.files.length > 0 && (
                            <ul className="ml-2 border-l border-base-300">
                              {child.files.map((f) => (
                                <li
                                  key={f.id}
                                  className="flex items-center gap-1"
                                >
                                  <button
                                    className="btn btn-ghost btn-xs justify-start"
                                    onClick={() => setSelectedFile(f)}
                                  >
                                    {f.name}
                                  </button>
                                  <button
                                    className="btn btn-ghost btn-xs text-error"
                                    onClick={() => removeFile(f.id)}
                                    title="Remove"
                                  >
                                    ✕
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      ))}
                    </ul>
                  </details>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* RIGHT: Files panel + preview */}
        <div className="card bg-base-100 shadow-md">
          <div className="card-body gap-4">
            <div className="flex items-center gap-2">
              <h2 className="card-title flex-1">Files</h2>
              <input
                type="text"
                placeholder="Search files..."
                className="input input-bordered input-sm w-full max-w-xs"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
            </div>

            {filteredFiles.length === 0 ? (
              <div className="alert">
                <span>No files yet. Use the + on the left to upload.</span>
              </div>
            ) : (
              <div className="overflow-auto max-h-56">
                <table className="table table-zebra">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Bucket</th>
                      <th className="text-right">Size</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFiles.map((f) => (
                      <tr key={f.id}>
                        <td>
                          <button
                            className="link"
                            onClick={() => setSelectedFile(f)}
                          >
                            {f.name}
                          </button>
                        </td>
                        <td className="text-xs opacity-70">
                          {f.groupName} / {f.childName}
                        </td>
                        <td className="text-right text-xs">
                          {formatBytes(f.size)}
                        </td>
                        <td className="text-right">
                          <button
                            className="btn btn-ghost btn-xs text-error"
                            onClick={() => removeFile(f.id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="divider my-2" />

            <Preview file={selectedFile} />
          </div>
        </div>
      </div>
    </ScreenContainer>
  );
}

// ===== Small components =====
function UploadButton({ onFiles, multiple = true, className = "" }) {
  const inputRef = useRef(null);
  return (
    <>
      <input
        ref={inputRef}
        type="file"
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          if (files.length) onFiles(files);
          e.target.value = ""; // allow re-select
        }}
      />
      <button
        className={`btn btn-ghost btn-xs ${className}`}
        onClick={() => inputRef.current?.click()}
        title="Add files"
      >
        ＋
      </button>
    </>
  );
}

function AddGroup({ onAdd }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  return (
    <div className="dropdown dropdown-end">
      <button className="btn btn-sm" onClick={() => setOpen((v) => !v)}>
        New group
      </button>
      {open && (
        <div className="dropdown-content z-[1] bg-base-100 rounded-box p-3 w-64 shadow">
          <label className="form-control w-full">
            <span className="label-text">Group name</span>
            <input
              className="input input-bordered input-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <div className="mt-3 flex justify-end gap-2">
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setOpen(false)}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                if (!name.trim()) return;
                onAdd(name.trim());
                setName("");
                setOpen(false);
              }}
            >
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function AddChild({ onAdd }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  return (
    <div className="dropdown dropdown-end">
      <button
        className="btn btn-ghost btn-xs"
        onClick={() => setOpen((v) => !v)}
        title="Add sub-item"
      >
        ＋
      </button>
      {open && (
        <div className="dropdown-content z-[1] bg-base-100 rounded-box p-3 w-60 shadow">
          <label className="form-control w-full">
            <span className="label-text">Sub-item name</span>
            <input
              className="input input-bordered input-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <div className="mt-3 flex justify-end gap-2">
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setOpen(false)}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                if (!name.trim()) return;
                onAdd(name.trim());
                setName("");
                setOpen(false);
              }}
            >
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Preview({ file }) {
  if (!file)
    return (
      <div className="prose max-w-none opacity-70">
        <h3>Preview</h3>
        <p>
          Select a file to preview. Images are shown inline. Text is rendered
          below. For other files, a download link appears.
        </p>
      </div>
    );
  const isImage = file.type.startsWith("image/");
  const isText =
    file.type.startsWith("text/") || /json|xml|csv/.test(file.type);
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{file.name}</h3>
        <a className="btn btn-ghost btn-xs" href={file.url} download>
          Download
        </a>
      </div>
      {isImage ? (
        <img
          src={file.url}
          alt={file.name}
          className="rounded-xl max-h-80 object-contain"
        />
      ) : isText ? (
        <TextFileView file={file.file} />
      ) : (
        <div className="alert">
          <span>Preview not supported. You can download the file instead.</span>
        </div>
      )}
    </div>
  );
}

function TextFileView({ file }) {
  const [text, setText] = useState("Loading...");
  useEffect(() => {
    const reader = new FileReader();
    reader.onload = () => setText(String(reader.result));
    reader.onerror = () => setText("Failed to read file");
    reader.readAsText(file);
    return () => reader.abort?.();
  }, [file]);
  return (
    <pre className="mockup-code whitespace-pre-wrap text-xs max-h-80 overflow-auto p-4">
      {text}
    </pre>
  );
}

function formatBytes(bytes) {
  if (!+bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}
