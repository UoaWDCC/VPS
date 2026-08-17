import React, { useEffect, useRef, useState, useContext } from "react";
import toast from "react-hot-toast";
import { useParams } from "react-router-dom";
import { useHistory } from "react-router-dom";
import {
  ArrowLeftIcon,
  CheckIcon,
  PencilIcon,
  PlusIcon,
  XIcon,
} from "lucide-react";
import AddGroup from "./components/AddGroup";
import StateConditionalMenu from "../../components/StateVariables/StateConditionalMenu";
import { api } from "../../util/api";
import AuthenticationContext from "../../context/AuthenticationContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { filterTreeBySearch, normaliseFile } from "./util";
import { v4 as uuid } from "uuid";
import ResourcePreview from "./ResourcePreview";
import SkeletonBody from "./ResourcesSkeleton";

const RESOURCE_NAME_MAX_LENGTH = 255;

function isTemp(resource) {
  return resource._id.startsWith("temp.");
}

async function uploadFileResource(user, scenarioId, parentId, file) {
  const formData = new FormData();
  formData.append("file", file);

  const fileResponse = await api.post(
    user,
    `api/files/${scenarioId}`,
    formData
  );

  const resourceResponse = await api.post(user, `api/resources/${scenarioId}`, {
    parentId,
    name: fileResponse.data.name,
    fileId: fileResponse.data._id,
  });
  return resourceResponse.data;
}

async function createResourceCollection(user, scenarioId, name) {
  const res = await api.post(user, `api/resources/${scenarioId}/collection`, {
    name,
  });
  return res.data;
}

async function removeResource(user, scenarioId, resourceId) {
  await api.delete(user, `/api/resources/${scenarioId}/${resourceId}`);
}

async function renameResource(user, scenarioId, resourceId, name) {
  const res = await api.patch(
    user,
    `/api/resources/${scenarioId}/${resourceId}`,
    { name }
  );
  return res.data;
}

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

export default function ManageResourcesPage() {
  const { scenarioId } = useParams();
  const history = useHistory();

  const { user } = useContext(AuthenticationContext);
  const queryClient = useQueryClient();

  const [selectedResourceId, setSelectedResourceId] = useState(null);
  const [search, setSearch] = useState("");

  const resourcesQuery = useQuery({
    queryKey: ["resources", scenarioId],
    queryFn: () => getResources(user, scenarioId),
  });

  const addFileResourceMutation = useMutation({
    mutationFn: ({ parentId, file }) =>
      uploadFileResource(user, scenarioId, parentId, file),
    onMutate: async ({ parentId, file }) => {
      await queryClient.cancelQueries(["resources", scenarioId]);
      const tempId = `temp.${uuid()}`;
      const temp = { parentId, name: file.name, _id: tempId, type: "file" };
      queryClient.setQueryData(["resources", scenarioId], (prev) => [
        temp,
        ...(prev ?? []),
      ]);
      return { tempId };
    },
    onSuccess: () => queryClient.invalidateQueries(["resources", scenarioId]),
    onError: (e, _, context) => {
      const tempId = context?.tempId;
      if (tempId) {
        queryClient.setQueryData(["resources", scenarioId], (prev) =>
          (prev ?? []).filter((r) => r._id !== tempId)
        );
      }
      console.error(e);
      toast.error("Something went wrong uploading the resource");
    },
  });

  const addResourceCollectionMutation = useMutation({
    mutationFn: (name) => createResourceCollection(user, scenarioId, name),
    onMutate: async (name) => {
      await queryClient.cancelQueries(["resources", scenarioId]);
      const tempId = `temp.${uuid()}`;
      const temp = { name, _id: tempId, type: "collection", children: [] };
      queryClient.setQueryData(["resources", scenarioId], (prev) => [
        temp,
        ...(prev ?? []),
      ]);
      return { tempId };
    },
    onSuccess: () => queryClient.invalidateQueries(["resources", scenarioId]),
    onError: (e, _, context) => {
      const tempId = context?.tempId;
      if (tempId) {
        queryClient.setQueryData(["resources", scenarioId], (prev) =>
          (prev ?? []).filter((r) => r._id !== tempId)
        );
      }
      console.error(e);
      toast.error("Something went wrong creating the collection");
    },
  });

  const deleteResourceMutation = useMutation({
    mutationFn: (resourceId) => removeResource(user, scenarioId, resourceId),
    onMutate: async (resourceId) => {
      await queryClient.cancelQueries(["resources", scenarioId]);
      queryClient.setQueryData(["resources", scenarioId], (prev) =>
        (prev ?? []).filter(
          (r) => r._id !== resourceId && r.parentId !== resourceId
        )
      );
    },
    onError: (e) => {
      console.error(e);
      toast.error("Something went wrong deleting the resource");
    },
    onSettled: () => queryClient.invalidateQueries(["resources", scenarioId]),
  });

  const renameResourceMutation = useMutation({
    mutationFn: ({ resourceId, name }) =>
      renameResource(user, scenarioId, resourceId, name),
    onMutate: async ({ resourceId, name }) => {
      await queryClient.cancelQueries(["resources", scenarioId]);
      const previous = queryClient.getQueryData(["resources", scenarioId]);
      queryClient.setQueryData(["resources", scenarioId], (prev) =>
        (prev ?? []).map((r) => (r._id === resourceId ? { ...r, name } : r))
      );
      return { previous };
    },
    onError: (e, _, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["resources", scenarioId], context.previous);
      }
      console.error(e);
      toast.error("Something went wrong renaming the resource");
    },
    onSettled: () => queryClient.invalidateQueries(["resources", scenarioId]),
  });

  function goBack() {
    history.push(`/scenario/${scenarioId}`);
  }

  const resourceTree = buildResourceTree(resourcesQuery.data ?? []);
  const filteredTree = filterTreeBySearch(resourceTree, search);

  const foundResource = resourcesQuery.data?.find(
    (r) => r._id === selectedResourceId
  );
  const selectedResource = foundResource ? normaliseFile(foundResource) : null;

  return (
    <div className="font-ibm flex min-h-dvh w-screen flex-col gap-l overflow-y-auto lg:h-dvh lg:overflow-hidden">
      <div className="flex flex-none px-l pt-l">
        <button onClick={goBack} className="btn btn-phantom text-m">
          <ArrowLeftIcon size={20} />
          Back
        </button>
      </div>

      <div className="u-container min-h-0 w-full flex-1 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="container mx-auto h-full min-h-0">
          {resourcesQuery.isLoading ? (
            <SkeletonBody />
          ) : resourcesQuery.isError ? (
            <div className="h-full flex flex-col items-center justify-center gap-3">
              <div className="alert alert-error max-w-md">
                <span>{resourcesQuery.error.message}</span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:h-full lg:min-h-0 lg:grid-cols-3">
              {/* LEFT: Groups and files */}
              <div className="card min-h-[35dvh] min-w-0 overflow-hidden bg-base-100 shadow-md lg:h-full lg:min-h-0">
                <div className="card-body flex min-h-0 flex-col gap-4 px-0">
                  <h1 className="flex-none text-xl">Uploaded Resources</h1>

                  <label
                    htmlFor="authoring-resource-search"
                    className="sr-only"
                  >
                    Search files and collections
                  </label>
                  <input
                    id="authoring-resource-search"
                    type="search"
                    className="w-full flex-none border-0 border-b-1 border-primary pb-3 outline-none"
                    placeholder="Search files and collections"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-m">Uploaded Resources</h2>
                    <AddGroup onAdd={addResourceCollectionMutation.mutate} />
                  </div>

                  <ul className="menu min-h-0 w-full flex-1 overflow-auto rounded-box bg-base-100 p-0">
                    {search.trim() && filteredTree.length === 0 && (
                      <li className="p-2 opacity-60">
                        No matching resources found.
                      </li>
                    )}
                    {filteredTree.map((resource) => (
                      <li key={resource._id} className="overflow-hidden">
                        {resource.type === "collection" ? (
                          <details className="overflow-hidden">
                            <summary
                              className={`flex items-center ${isTemp(resource) ? "text-primary" : ""} ${selectedResource?._id === resource._id ? "bg-base-200" : ""}`}
                              onClick={() =>
                                !isTemp(resource) &&
                                setSelectedResourceId(resource._id)
                              }
                            >
                              <span
                                className="text--1 truncate"
                                title={resource.name}
                              >
                                {resource.name}
                              </span>
                              <div className="flex items-center ml-auto">
                                <UploadButton
                                  multiple={false}
                                  disabled={isTemp(resource)}
                                  onFiles={(file) => {
                                    addFileResourceMutation.mutate({
                                      parentId: resource._id,
                                      file,
                                    });
                                  }}
                                />
                                <button
                                  className="btn btn-phantom btn-xs"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteResourceMutation.mutate(resource._id);
                                  }}
                                  title="Delete group"
                                  disabled={isTemp(resource)}
                                >
                                  <XIcon size={16} />
                                </button>
                              </div>
                            </summary>

                            <ul className="overflow-hidden">
                              {resource.children.length === 0 && (
                                <li className="opacity-60 p-2">No files yet</li>
                              )}
                              {resource.children.map((child) => (
                                <li key={child._id} className="overflow-hidden">
                                  <ResourceNameField
                                    resource={child}
                                    disabled={isTemp(child)}
                                    onSelect={() =>
                                      setSelectedResourceId(child._id)
                                    }
                                    onRename={(name) =>
                                      renameResourceMutation.mutate({
                                        resourceId: child._id,
                                        name,
                                      })
                                    }
                                    actions={
                                      <button
                                        className="btn btn-phantom btn-xs px-0"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          deleteResourceMutation.mutate(
                                            child._id
                                          );
                                        }}
                                        title="Delete file"
                                        disabled={isTemp(child)}
                                      >
                                        <XIcon size={16} />
                                      </button>
                                    }
                                  />
                                </li>
                              ))}
                            </ul>
                          </details>
                        ) : (
                          <ResourceNameField
                            resource={resource}
                            disabled={isTemp(resource)}
                            onSelect={() => setSelectedResourceId(resource._id)}
                            onRename={(name) =>
                              renameResourceMutation.mutate({
                                resourceId: resource._id,
                                name,
                              })
                            }
                            actions={
                              <button
                                className="btn btn-phantom btn-xs px-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteResourceMutation.mutate(resource._id);
                                }}
                                title="Delete file"
                                disabled={isTemp(resource)}
                              >
                                <XIcon size={16} />
                              </button>
                            }
                          />
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* RIGHT: File list and preview */}
              <div className="card min-h-[60dvh] overflow-auto pb-[max(1rem,env(safe-area-inset-bottom))] lg:col-span-2 lg:h-full lg:min-h-0">
                <div className="card-body flex min-h-full flex-col gap-4">
                  {selectedResource ? (
                    <>
                      <StateConditionalMenu resource={selectedResource} />
                      {selectedResource?.type === "file" && (
                        <div className="min-h-[50dvh] flex-1 lg:min-h-0">
                          <ResourcePreview file={selectedResource} />
                        </div>
                      )}
                    </>
                  ) : (
                    <span>Select a resource to show the preview</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper components
function splitFileName(name) {
  const dotIndex = name.lastIndexOf(".");
  if (dotIndex <= 0) return { base: name, ext: "" };
  return { base: name.slice(0, dotIndex), ext: name.slice(dotIndex) };
}

function ResourceNameField({
  resource,
  disabled,
  onSelect,
  onRename,
  actions,
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(() => splitFileName(resource.name).base);
  const inputRef = useRef(null);

  const { ext } = splitFileName(resource.name);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
    }
  }, [editing]);

  function startEditing(e) {
    e.stopPropagation();
    if (disabled) return;
    setValue(splitFileName(resource.name).base);
    setEditing(true);
  }

  function commitEdit() {
    setEditing(false);
    const trimmedBase = value.trim();
    if (!trimmedBase) return;
    const newName = `${trimmedBase}${ext}`;
    if (newName === resource.name) return;
    onRename(newName);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      inputRef.current?.blur();
    } else if (e.key === "Escape") {
      setValue(splitFileName(resource.name).base);
      setEditing(false);
    }
  }

  const rowStyle = editing
    ? {
        gridTemplateColumns: "minmax(0, 1fr) auto",
        backgroundColor: "transparent",
        boxShadow: "none",
        color: "var(--color-base-content)",
        cursor: "auto",
      }
    : { gridTemplateColumns: "minmax(0, 1fr) auto auto" };

  return (
    <div className="grid items-center gap-1 overflow-hidden" style={rowStyle}>
      {editing ? (
        <div className="flex min-w-0 items-center gap-1">
          <input
            ref={inputRef}
            type="text"
            className="input input-xs input-bordered min-w-0 flex-1"
            style={{
              "--input-color":
                "color-mix(in oklab, var(--color-base-content) 20%, transparent)",
              backgroundColor: "var(--color-base-100)",
              borderColor:
                "color-mix(in oklab, var(--color-base-content) 20%, transparent)",
              color: "var(--color-base-content)",
              boxShadow: "none",
              outline: "none",
              userSelect: "text",
              WebkitUserSelect: "text",
            }}
            value={value}
            maxLength={Math.max(RESOURCE_NAME_MAX_LENGTH - ext.length, 1)}
            onChange={(e) => setValue(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
          />
          {ext && (
            <span
              className="shrink-0 text--1 opacity-60"
              title="File type can't be changed"
            >
              {ext}
            </span>
          )}
        </div>
      ) : (
        <>
          <a
            className={`text--1 truncate ${isTemp(resource) ? "text-primary" : ""}`}
            title={resource.name}
            onClick={() => !disabled && onSelect()}
          >
            {resource.name}
          </a>
          <button
            type="button"
            className="btn btn-phantom btn-xs px-0"
            onClick={startEditing}
            title="Rename"
            disabled={disabled}
          >
            <PencilIcon size={14} />
          </button>
        </>
      )}
      {editing ? (
        <button
          type="button"
          className="btn btn-phantom btn-xs px-0"
          onClick={() => inputRef.current?.blur()}
          title="Confirm rename"
        >
          <CheckIcon size={14} />
        </button>
      ) : (
        actions
      )}
    </div>
  );
}

function UploadButton({
  onFiles,
  multiple = true,
  disabled = false,
  className = "",
}) {
  const inputRef = useRef(null);
  return (
    <>
      <input
        ref={inputRef}
        type="file"
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files[0];
          e.target.value = "";
          if (!file) return;
          onFiles(file);
        }}
      />
      <button
        className={`btn btn-phantom btn-xs ${className}`}
        onClick={() => inputRef.current?.click()}
        title="Add files"
        disabled={disabled}
      >
        <PlusIcon size={16} />
      </button>
    </>
  );
}
