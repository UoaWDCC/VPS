import React, { useRef, useState, useEffect, useContext } from "react";
import { getAuth } from "firebase/auth";
import axios from "axios";
import toast from "react-hot-toast";
import { useParams } from "react-router-dom";
import { useHistory } from "react-router-dom";
import {
  ArrowLeftIcon,
  PlayIcon,
  UsersIcon,
  PlusIcon,
  XIcon,
} from "lucide-react";
import AddGroup from "./components/AddGroup";
import StateConditionalMenu from "../../components/StateVariables/StateConditionalMenu";
import MDTextViewer from "../playScenario/components/MDTextViewer";
import { api } from "../../util/api";
import AuthenticationContext from "../../context/AuthenticationContext";
import { useQuery } from "@tanstack/react-query";
import { normaliseFile } from "./util";

function normaliseGroup(g) {
  return {
    id: g._id || g.id,
    name: g.name,
    order: g.order ?? 0,
    stateConditionals: g.stateConditionals || [],
    files: (g.files || []).map((f) => normaliseFile(f)),
  };
}

async function uploadResource(user, scenarioId, groupId, file) {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const fileResponse = await api.post(
      user,
      `api/files/${scenarioId}`,
      formData
    );

    const resourceResponse = await api.post(
      user,
      `api/resources/${scenarioId}`,
      {
        groupId,
        name: fileResponse.data.name,
        fileId: fileResponse.data._id,
      }
    );
    toast.success(`Resource created`);
    return resourceResponse.data;
  } catch (err) {
    console.error(err);
    toast.error("Upload failed");
  }
}

async function removeResource(user, scenarioId, resourceId) {
  try {
    await api.delete(user, `/api/resources/${scenarioId}/${resourceId}`);
    toast.success("Resource deleted");
    return resourceId;
  } catch (err) {
    console.error(err);
    toast.error("Delete failed");
  }
}

// Page for managing resources (collections and files) for a scenario
export default function ManageResourcesPage() {
  const { scenarioId } = useParams();
  const history = useHistory();
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
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const { user } = useContext(AuthenticationContext);

  // Load groups and files
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get(
          user,
          `/api/collections/tree/${scenarioId}`
        );
        const normalized = (data || []).map((g) => normaliseGroup(g)) || [];
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

  async function addResourceToGroup(groupId, file) {
    const resource = await uploadResource(user, scenarioId, groupId, file);
    if (!resource) return;

    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId
          ? { ...g, files: [normaliseFile(resource), ...(g.files || [])] }
          : g
      )
    );
  }

  async function deleteResource(resourceId) {
    const success = await removeResource(user, scenarioId, resourceId);
    if (!success) return;

    setGroups((prev) =>
      prev.map((g) => ({
        ...g,
        files: (g.files || []).filter((f) => f.id !== resourceId),
      }))
    );

    if (selectedFile?.id === resourceId) setSelectedFile(null);
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
      if (selectedGroup?.id === groupId) setSelectedGroup(null);

      toast.success("Group deleted");
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.error || "Failed to delete group");
    }
  }

  function updateFile(updatedFile) {
    const normalisedFile = normaliseFile(updatedFile);
    setSelectedFile(normalisedFile);
    setGroups((prev) =>
      prev.map((g) =>
        g.id === normalisedFile.groupId
          ? {
              ...g,
              files: (g.files || []).map((f) =>
                f.id === normalisedFile.id ? normalisedFile : f
              ),
            }
          : g
      )
    );
  }

  function updateGroup(updatedGroup) {
    const normalisedGroup = normaliseGroup(updatedGroup);
    setSelectedGroup((prev) => ({
      ...normalisedGroup,
      files: prev?.files || normalisedGroup.files,
    }));
    setGroups((prev) =>
      prev.map((g) =>
        g.id === normalisedGroup.id
          ? {
              ...g,
              ...normalisedGroup,
              files: g.files || [],
            }
          : g
      )
    );
  }

  const selectedTarget = selectedFile || selectedGroup;
  const selectedTargetType = selectedFile
    ? "File"
    : selectedGroup
      ? "Collection"
      : null;
  const selectedTargetEndpoint = selectedFile
    ? `/api/resources/${scenarioId}/${selectedFile.id}/conditionals`
    : selectedGroup
      ? `/api/collections/groups/${selectedGroup.id}/state-conditionals`
      : "";

  return (
    <div className="font-ibm flex flex-col h-screen w-screen overflow-hidden gap-2xl">
      <div className="flex pt-l px-l">
        <button onClick={goBack} className="btn btn-phantom text-m">
          <ArrowLeftIcon size={20} />
          Back
        </button>

        <button onClick={goToGroups} className="btn btn-phantom text-m ml-auto">
          <UsersIcon size={20} />
          Groups
        </button>

        <button onClick={playScenario} className="btn btn-phantom text-m">
          <PlayIcon size={20} />
          Play
        </button>
      </div>

      <div className="u-container w-full">
        <div className="container mx-auto">
          <h1 className="text-xl mb-l">Uploaded Resources</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* LEFT: Groups and files */}
            <div className="card bg-base-100 shadow-md">
              <div className="card-body gap-4 px-0">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-m">Collections</h2>
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
                            stateConditionals: data.stateConditionals || [],
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
                        <summary
                          className={`flex items-center ${
                            selectedGroup?.id === group.id && !selectedFile
                              ? "bg-base-200"
                              : ""
                          }`}
                          onClick={() => {
                            setSelectedGroup(group);
                            setSelectedFile(null);
                          }}
                        >
                          <span className="text--1 truncate">{group.name}</span>
                          <div className="flex items-center ml-auto">
                            <UploadButton
                              multiple={false}
                              onFiles={(files) =>
                                addResourceToGroup(group.id, files[0])
                              }
                            />
                            <button
                              className="btn btn-phantom btn-xs"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                deleteGroup(group.id);
                              }}
                              title="Delete group"
                            >
                              <XIcon size={16} />
                            </button>
                          </div>
                        </summary>

                        <ul>
                          {group.files.length === 0 && (
                            <li className="opacity-60 p-2">No files yet</li>
                          )}

                          {group.files.map((f) => (
                            <li key={f.id}>
                              <div className="flex items-center justify-between">
                                <a
                                  className="min-w-0 flex-1 text--1 truncate"
                                  onClick={() =>
                                    setSelectedFile({
                                      ...f,
                                      groupId: group.id,
                                      groupName: group.name,
                                    })
                                  }
                                >
                                  {f.name}
                                </a>
                                <button
                                  className="btn btn-phantom btn-xs px-0"
                                  onClick={() => deleteResource(f.id)}
                                  title="Delete file"
                                >
                                  <XIcon size={16} />
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </details>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* RIGHT: File list and preview */}
            <div className="card col-span-2">
              <div className="card-body gap-4">
                {selectedTarget ? (
                  <div>
                    <div className="text-xs text-primary">
                      {selectedTargetType}
                    </div>
                    <h2 className="text-m">{selectedTarget.name}</h2>
                  </div>
                ) : null}
                <StateConditionalMenu
                  target={selectedTarget}
                  title={`${selectedTargetType || "Resource"} State Conditionals`}
                  endpoint={selectedTargetEndpoint}
                  updateTarget={selectedFile ? updateFile : updateGroup}
                />
                <Preview file={selectedFile} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
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
        className={`btn btn-phantom btn-xs ${className}`}
        onClick={() => inputRef.current?.click()}
        title="Add files"
      >
        <PlusIcon size={16} />
      </button>
    </>
  );
}

async function loadText(url) {
  return fetch(url).then((res) => {
    if (!res.ok) throw new Error(`failed to load file (${res.status})`);
    return res.text();
  });
}

function Preview({ file }) {
  const text = useQuery({
    queryKey: ["file-text", file?.url],
    queryFn: () => loadText(file.url),
    enabled: !!(file?.contentType?.startsWith("text") && file?.url),
  });

  if (!file)
    return (
      <div className="prose max-w-none opacity-70">
        <h3>Preview</h3>
        <p>
          Select a file to preview. Images and PDFs files show inline;
          Text/Markdown render below; other files provide a download.
        </p>
      </div>
    );

  const isImage = file.type === "image";
  const isText =
    file.type === "document" && file.contentType !== "application/pdf";
  const isPDF = file.contentType === "application/pdf";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-m">{file.name}</h3>
        <a className="btn btn-phantom btn-xs" href={file.url} download>
          Download
        </a>
      </div>

      {isImage ? (
        <img
          src={file.url}
          alt={file.name}
          className="rounded-xl max-h-80 object-contain"
        />
      ) : isPDF ? (
        <div className="w-full h-full">
          <iframe
            src={file.url}
            title={file.name}
            className="w-full h-full min-h-[60vh] rounded-xl border"
          />
        </div>
      ) : isText && text.isLoading ? (
        <div className="space-y-2">
          <div className="skeleton h-6 w-1/2" />
          <div className="skeleton h-48 w-full" />
        </div>
      ) : isText && text.isError ? (
        <div className="alert alert-warning">
          <span>{text.error?.message || "Failed to load preview."}</span>
        </div>
      ) : isText ? (
        <MDTextViewer file={file} content={text.data} />
      ) : (
        <div className="alert">
          <span>Preview not supported. You can download the file instead.</span>
        </div>
      )}
    </div>
  );
}
