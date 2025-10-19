import React, { useRef, useState, useEffect } from "react";
import { getAuth } from "firebase/auth";
import axios from "axios";
// Papa (CSV parsing) removed from top strip — keep parser usage local to CSV upload controls where needed
import toast from "react-hot-toast";
import { useParams } from "react-router-dom";
import ScreenContainer from "../../components/ScreenContainer/ScreenContainer";
import { useHistory } from "react-router-dom";
import { ArrowLeftIcon, PlayIcon, UsersIcon } from "lucide-react";
import AddGroup from "./components/AddGroup";

export default function ManageResourcesPage() {
  const { scenarioId } = useParams();
  const history = useHistory();

  const [setResources] = useState([]);

  // Fetch resources (CSV uploads)
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

  function goBack() {
    history.push(`/scenario/${scenarioId}`);
  }

  function goToGroups() {
    history.push(`/scenario/${scenarioId}/manage-groups`);
  }

  function playScenario() {
    window.open(`/play/${scenarioId}`, "_blank");
  }

  // Groups (each with files)
  const [groups, setGroups] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);

  // Load groups and files
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

        const normalized =
          (data || []).map((g) => ({
            id: g._id,
            name: g.name,
            order: g.order ?? 0,
            files: (g.files || []).map((f) => ({
              id: f._id,
              name: f.name,
              size: f.size,
              type: f.type,
              createdAt: f.createdAt,
            })),
          })) || [];

        if (!cancelled) setGroups(normalized);
      } catch (err) {
        console.error(err);
        if (!cancelled) toast.error("Failed to load groups/files");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [scenarioId]);

  async function makeDownloadUrl(fileId) {
    const user = getAuth().currentUser;
    const token = await user.getIdToken();
    return `/api/files/download/${fileId}?token=${encodeURIComponent(token)}`;
  }

  // Upload directly to group
  async function addFilesTo(groupId, files) {
    try {
      const user = getAuth().currentUser;
      if (!user) {
        toast.error("You must be logged in to upload.");
        return;
      }
      const idToken = await user.getIdToken();

      const fd = new FormData();
      fd.set("scenarioId", scenarioId);
      fd.set("groupId", groupId);
      for (const file of files) fd.append("files", file);

      const { data } = await axios.post("/api/files/upload", fd, {
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "multipart/form-data",
        },
      });

      const uploaded = data?.files || [];
      if (!uploaded.length) return;

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
            ? { ...g, files: [...normalizedUploaded, ...(g.files || [])] }
            : g
        )
      );

      toast.success(`Uploaded ${normalizedUploaded.length} file(s)`);
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.error || "Upload failed");
    }
  }

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
          files: (g.files || []).filter((f) => f.id !== fileId),
        }))
      );

      if (selectedFile?.id === fileId) setSelectedFile(null);
      toast.success("Deleted");
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.error || "Delete failed");
    }
  }

  async function deleteGroup(groupId) {
    const ok = window.confirm(
      "Delete this group and ALL of its files? This cannot be undone."
    );
    if (!ok) return;
    try {
      const user = getAuth().currentUser;
      if (!user) {
        toast.error("You must be logged in to delete.");
        return;
      }
      const idToken = await user.getIdToken();
      await axios.delete(`/api/collections/groups/${groupId}`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });

      setGroups((prev) => prev.filter((g) => g.id !== groupId));

      if (selectedFile && selectedFile.groupId === groupId)
        setSelectedFile(null);

      toast.success("Group deleted");
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.error || "Failed to delete group");
    }
  }

  return (
    <ScreenContainer vertical>
      <div className="font-ibm flex flex-col h-screen w-screen overflow-hidden gap-2xl">
        <div className="flex pt-l px-l">
          <button onClick={goBack} className="btn btn-phantom text-m">
            <ArrowLeftIcon size={20} />
            Back
          </button>

          <button
            onClick={goToGroups}
            className="btn btn-phantom text-m ml-auto"
          >
            <UsersIcon size={20} />
            Groups
          </button>

          <button onClick={playScenario} className="btn btn-phantom text-m">
            <PlayIcon size={20} />
            Play
          </button>
        </div>

        <div className="u-container w-full">
          <h1 className="text-xl mb-l">Uploaded Resources</h1>

          <div className="container mx-auto p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* LEFT: Groups and files */}
            <div className="card bg-base-100 shadow-md">
              <div className="card-body gap-4">
                <div className="flex items-center justify-between gap-2">
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
                        setGroups((g) => [
                          ...g,
                          {
                            id: data._id,
                            name: data.name,
                            order: data.order ?? 0,
                            files: [],
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
                          <UploadButton
                            onFiles={(files) => addFilesTo(group.id, files)}
                          />
                          <button
                            className="btn btn-ghost btn-xs text-error"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              deleteGroup(group.id);
                            }}
                            title="Delete group"
                          >
                            ✕
                          </button>
                        </summary>

                        {group.files.length === 0 && (
                          <li className="opacity-60 p-2">No files yet</li>
                        )}

                        {group.files.map((f) => (
                          <li key={f.id} className="flex items-center gap-1">
                            <button
                              className="btn btn-ghost btn-xs justify-start"
                              onClick={() =>
                                setSelectedFile({
                                  ...f,
                                  groupId: group.id,
                                  groupName: group.name,
                                })
                              }
                            >
                              {f.name}
                            </button>
                            <button
                              className="btn btn-ghost btn-xs text-error"
                              onClick={() => removeFile(f.id)}
                            >
                              ✕
                            </button>
                          </li>
                        ))}
                      </details>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* RIGHT: File list and preview */}
            <div className="card bg-base-100 shadow-md">
              <div className="divider my-2" />
              <Preview file={selectedFile} makeDownloadUrl={makeDownloadUrl} />
            </div>
          </div>
        </div>
      </div>
    </ScreenContainer>
  );
}

// Helper components
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
