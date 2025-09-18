import React, { useMemo, useRef, useState, useEffect } from "react";
import { getAuth } from "firebase/auth";
import axios from "axios";
import Papa from "papaparse";
import toast from "react-hot-toast";
import { useParams } from "react-router-dom";
import ScreenContainer from "../../components/ScreenContainer/ScreenContainer";
import TopBar from "../../components/TopBar/TopBar";
import AddGroup from "./components/AddGroup";
import AddChild from "./components/AddChild";

export default function ManageResourcesPage() {
  const { scenarioId } = useParams();

  const csvInputRef = useRef(null);
  const [resources, setResources] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const user = getAuth().currentUser;
        if (!user) {
          toast.error("You must be logged in to view resources.");
          return;
        }
        const idToken = await user.getIdToken();
        const { data } = await axios.get(
          `/api/resources/scenario/${scenarioId}`,
          {
            headers: { Authorization: `Bearer ${idToken}` },
          }
        );
        if (!cancelled) setResources(data);
      } catch (err) {
        if (!cancelled) {
          toast.error(
            "Error fetching resources: " + (err?.message || String(err))
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
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
          const user = getAuth().currentUser;
          if (!user) {
            toast.error("You must be logged in to upload.");
            return;
          }
          const idToken = await user.getIdToken();
          const res = await axios.post(`/api/resources/${scenarioId}`, data, {
            headers: { Authorization: `Bearer ${idToken}` },
          });
          toast.success(`Successfully uploaded ${data.length} resources!`);
          setResources((prev) => [
            ...prev,
            ...(Array.isArray(res.data) ? res.data : []),
          ]);
        } catch (error) {
          const msg = error?.response?.data || error.message || "Unknown error";
          toast.error(`Error uploading: ${msg}`);
        } finally {
          event.target.value = ""; // reset input
        }
      },
    });
  };

  const [groups, setGroups] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filter, setFilter] = useState("");

  // Load persisted tree on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const user = getAuth().currentUser;
        if (!user) {
          toast.error("You must be logged in to view collections.");
          return;
        }
        const idToken = await user.getIdToken();
        const { data } = await axios.get(
          `/api/collections/tree/${scenarioId}`,
          {
            headers: { Authorization: `Bearer ${idToken}` },
          }
        );

        // Normalise server data to your existing UI shape
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

        if (!cancelled) setGroups(normalized);
      } catch (err) {
        console.error(err);
        if (!cancelled) toast.error("Failed to load folders/files");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [scenarioId]);

  // Helpers
  const findGroupIdByChildId = (childId) => {
    for (const g of groups) {
      if (g.children?.some((c) => c.id === childId)) return g.id;
    }
    return null;
  };

  const allFiles = useMemo(() => {
    const out = [];
    for (const g of groups) {
      for (const c of g.children || []) {
        for (const f of c.files || [])
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

  // Build a download URL that carries the Firebase token in the query (so <img>, <a> work)
  async function makeDownloadUrl(fileId) {
    const user = getAuth().currentUser;
    const token = await user.getIdToken();
    return `/api/files/download/${fileId}?token=${encodeURIComponent(token)}`;
  }

  // Upload from "+" button to the backend, then merge returned files into state
  async function addFilesTo(childId, files) {
    try {
      const user = getAuth().currentUser;
      if (!user) {
        toast.error("You must be logged in to upload.");
        return;
      }
      const idToken = await user.getIdToken();
      const groupId = findGroupIdByChildId(childId);
      if (!groupId) {
        toast.error("Could not determine group for this child");
        return;
      }

      const fd = new FormData();
      fd.set("scenarioId", scenarioId);
      fd.set("groupId", groupId);
      fd.set("childId", childId);
      for (const file of files) fd.append("files", file);

      const { data } = await axios.post("/api/files/upload", fd, {
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "multipart/form-data",
        },
      });

      const uploaded = data?.files || [];
      if (!uploaded.length) return;

      // Normalise uploaded files to UI shape and merge to the top of the list
      const normalizedUploaded = uploaded.map((f) => ({
        id: f._id,
        name: f.name,
        size: f.size,
        type: f.type,
        createdAt: f.createdAt,
      }));

      setGroups((prev) =>
        prev.map((g) =>
          g.id === groupId
            ? {
                ...g,
                children: g.children.map((c) =>
                  c.id === childId
                    ? {
                        ...c,
                        files: [...normalizedUploaded, ...(c.files || [])],
                      }
                    : c
                ),
              }
            : g
        )
      );

      toast.success(`Uploaded ${normalizedUploaded.length} file(s)`);
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.error || "Upload failed");
    }
  }

  // Delete file both server & local state
  async function removeFile(fileId) {
    try {
      const user = getAuth().currentUser;
      if (!user) {
        toast.error("You must be logged in to delete.");
        return;
      }
      const idToken = await user.getIdToken();
      await axios.delete(`/api/files/${fileId}`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });

      setGroups((prev) =>
        prev.map((g) => ({
          ...g,
          children: g.children.map((c) => ({
            ...c,
            files: (c.files || []).filter((f) => f.id !== fileId),
          })),
        }))
      );

      if (selectedFile?.id === fileId) setSelectedFile(null);
      toast.success("Deleted");
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.error || "Delete failed");
    }
  }

  return (
    <ScreenContainer vertical>
      <TopBar back={`/scenario/${scenarioId}`}>
        <input
          type="file"
          ref={csvInputRef}
          accept=".csv"
          className="hidden"
          onChange={handleCsvUpload}
        />
        {/* <button className="btn vps w-[100px]" onClick={triggerCsvUpload}>
          Upload CSV
        </button> */}
      </TopBar>

      <section className="p-4">
        <h2 className="text-xl font-semibold mb-2">Uploaded Resources</h2>
      </section>

      <div className="container mx-auto p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Collections */}
        <div className="card bg-base-100 shadow-md">
          <div className="card-body gap-4">
            <div className="flex items-center justify-between">
              <h2 className="card-title">Collections</h2>
              <AddGroup
                onAdd={async (name) => {
                  try {
                    const user = getAuth().currentUser;
                    if (!user) return toast.error("You must be logged in.");
                    const idToken = await user.getIdToken();
                    const { data } = await axios.post(
                      "/api/collections/groups",
                      { scenarioId, name },
                      { headers: { Authorization: `Bearer ${idToken}` } }
                    );
                    // Append empty group
                    setGroups((g) => [
                      ...g,
                      {
                        id: data._id,
                        name: data.name,
                        order: data.order ?? 0,
                        children: [],
                      },
                    ]);
                  } catch (e) {
                    toast.error(
                      e?.response?.data?.error || "Failed to create group"
                    );
                  }
                }}
              />
            </div>

            <ul className="menu bg-base-100 rounded-box w-full">
              {groups.map((group) => (
                <li key={group.id}>
                  <details>
                    <summary className="flex items-center gap-2">
                      <span className="font-medium">{group.name}</span>
                      <AddChild
                        onAdd={async (name) => {
                          try {
                            const user = getAuth().currentUser;
                            if (!user)
                              return toast.error("You must be logged in.");
                            const idToken = await user.getIdToken();
                            const { data } = await axios.post(
                              "/api/collections/children",
                              { scenarioId, groupId: group.id, name },
                              {
                                headers: { Authorization: `Bearer ${idToken}` },
                              }
                            );
                            setGroups((prev) =>
                              prev.map((g) =>
                                g.id === group.id
                                  ? {
                                      ...g,
                                      children: [
                                        ...g.children,
                                        {
                                          id: data._id,
                                          name: data.name,
                                          order: data.order ?? 0,
                                          files: [],
                                        },
                                      ],
                                    }
                                  : g
                              )
                            );
                          } catch (e) {
                            toast.error(
                              e?.response?.data?.error ||
                                "Failed to create child"
                            );
                          }
                        }}
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
                                    onClick={() =>
                                      setSelectedFile({
                                        ...f,
                                        groupId: group.id,
                                        childId: child.id,
                                        groupName: group.name,
                                        childName: child.name,
                                      })
                                    }
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

        {/* Right: Files + Preview */}
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

            <Preview file={selectedFile} makeDownloadUrl={makeDownloadUrl} />
          </div>
        </div>
      </div>
    </ScreenContainer>
  );
}

/** Small "+" upload control */
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
          e.target.value = "";
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

/** Preview that pulls from backend download URL (with token) TO DO BROKEN*/
function Preview({ file, makeDownloadUrl }) {
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [text, setText] = useState(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!file) {
        setDownloadUrl(null);
        setText(null);
        return;
      }
      const url = await makeDownloadUrl(file.id);
      if (!cancelled) setDownloadUrl(url);
    })();

    return () => {
      cancelled = true;
    };
  }, [file, makeDownloadUrl]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!file || !downloadUrl) {
        setText(null);
        return;
      }
      const isText =
        file.type?.startsWith("text/") || /json|xml|csv/.test(file.type || "");
      if (!isText) {
        setText(null);
        return;
      }
      try {
        const resp = await fetch(downloadUrl);
        const t = await resp.text();
        if (!cancelled) setText(t);
      } catch {
        if (!cancelled) setText("Failed to load text preview");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [file, downloadUrl]);

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

  const isImage = file.type?.startsWith("image/");

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{file.name}</h3>
        {downloadUrl && (
          <a className="btn btn-ghost btn-xs" href={downloadUrl} download>
            Download
          </a>
        )}
      </div>

      {isImage && downloadUrl ? (
        <img
          src={downloadUrl}
          alt={file.name}
          className="rounded-xl max-h-80 object-contain"
        />
      ) : text != null ? (
        <pre className="mockup-code whitespace-pre-wrap text-xs max-h-80 overflow-auto p-4">
          {text}
        </pre>
      ) : (
        <div className="alert">
          <span>Preview not supported. You can download the file instead.</span>
        </div>
      )}
    </div>
  );
}

function formatBytes(bytes) {
  if (!+bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}
