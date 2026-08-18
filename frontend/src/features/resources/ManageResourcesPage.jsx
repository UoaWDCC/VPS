import React, { useRef, useState, useContext, createRef } from "react";
import toast from "react-hot-toast";
import { useParams } from "react-router-dom";
import { useHistory } from "react-router-dom";
import ResourceNameField from "./components/ResourceNameField";
import PropertyConditionalMenu from "../../components/Properties/PropertyConditionalMenu";
import {
  ArrowLeftIcon,
  FilePlusIcon,
  FolderPlusIcon,
  PlusIcon,
  SearchIcon,
  XIcon,
} from "lucide-react";
import { api } from "../../util/api";
import AuthenticationContext from "../../context/AuthenticationContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { filterTreeBySearch, isTemp, normaliseFile } from "./util";
import { v4 as uuid } from "uuid";
import ResourcePreview from "./ResourcePreview";
import SkeletonBody from "./ResourcesSkeleton";
import PopoverInput from "./components/PopoverInput";

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

  const inputRef = createRef(null);
  const pendingParentIdRef = useRef(null);

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

      {/* hidden input for resource upload */}
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files[0];
          e.target.value = "";
          if (!file) return;
          addFileResourceMutation.mutate({
            parentId: pendingParentIdRef.current,
            file,
          });
        }}
      />

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
              <div className="card min-h-[35dvh] min-w-0 overflow-hidden bg-base-100 lg:h-full lg:min-h-0">
                <div className="card-body flex min-h-0 flex-col gap-4 px-0">
                  <h1 className="flex-none text-xl">Uploaded Resources</h1>

                  <div className="flex items-center gap-4">
                    <label className="input search search-xs flex-grow">
                      <input
                        type="search"
                        placeholder="Search files and collections"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                      <SearchIcon size={20} />
                    </label>
                    {/* collection creation button */}
                    <PopoverInput
                      onSubmit={addResourceCollectionMutation.mutate}
                      label="Collection Name"
                      submitLabel="Create"
                      trigger={
                        <button
                          className="btn btn-phantom btn-xs p-0 tooltip tooltip-bottom"
                          data-tip="Create Collection"
                        >
                          <FolderPlusIcon size={16} />
                        </button>
                      }
                    />
                    {/* file upload button */}
                    <button
                      className="btn btn-phantom btn-xs p-0 tooltip tooltip-bottom"
                      data-tip="Upload Resource"
                      onClick={() => {
                        pendingParentIdRef.current = null;
                        inputRef.current?.click();
                      }}
                    >
                      <FilePlusIcon size={16} />
                    </button>
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
                                <button
                                  className="btn btn-phantom btn-xs"
                                  disabled={isTemp(resource)}
                                  onClick={(event) => {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    pendingParentIdRef.current = resource._id;
                                    inputRef.current?.click();
                                  }}
                                  title="Add files"
                                >
                                  <PlusIcon size={16} />
                                </button>
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
                      <PropertyConditionalMenu resource={selectedResource} />
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
