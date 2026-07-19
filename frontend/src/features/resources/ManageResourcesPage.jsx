import React, { useRef, useState, useContext } from "react";
import toast from "react-hot-toast";
import { useParams } from "react-router-dom";
import { useHistory } from "react-router-dom";
import { ArrowLeftIcon, PlusIcon, XIcon } from "lucide-react";
import AddGroup from "./components/AddGroup";
import StateConditionalMenu from "../../components/StateVariables/StateConditionalMenu";
import { api } from "../../util/api";
import AuthenticationContext from "../../context/AuthenticationContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { normaliseFile } from "./util";
import { v4 as uuid } from "uuid";
import ResourcePreview from "./ResourcePreview";

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

  const [selectedResource, setSelectedResource] = useState(null);

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
        ...prev,
        temp,
      ]);
      return { tempId };
    },
    onSuccess: () => queryClient.invalidateQueries(["resources", scenarioId]),
    onError: (e, _, context) => {
      const tempId = context?.tempId;
      if (tempId) {
        queryClient.setQueryData(["resources", scenarioId], (prev) =>
          prev.filter((r) => r._id !== tempId)
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
      const temp = { name, _id: tempId };
      queryClient.setQueryData(["resources", scenarioId], (prev) => [
        ...prev,
        temp,
      ]);
      return { tempId };
    },
    onSuccess: () => queryClient.invalidateQueries(["resources", scenarioId]),
    onError: (e, _, context) => {
      const tempId = context?.tempId;
      if (tempId) {
        queryClient.setQueryData(["resources", scenarioId], (prev) =>
          prev.filter((r) => r._id !== tempId)
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
        prev.filter((r) => r._id !== resourceId && r.parentId !== resourceId)
      );
    },
    onError: (e) => {
      console.error(e);
      toast.error("Something went wrong deleting the resource");
    },
    onSettled: () => queryClient.invalidateQueries(["resources", scenarioId]),
  });

  function goBack() {
    history.push(`/scenario/${scenarioId}`);
  }

  // TODO: loading and error handling
  if (resourcesQuery.isLoading || resourcesQuery.isError) {
    return null;
  }

  const resourceTree = buildResourceTree(resourcesQuery.data);

  return (
    <div className="font-ibm flex flex-col h-screen w-screen overflow-hidden gap-2xl">
      <div className="flex pt-l px-l">
        <button onClick={goBack} className="btn btn-phantom text-m">
          <ArrowLeftIcon size={20} />
          Back
        </button>
      </div>

      <div className="u-container w-full">
        <div className="container mx-auto">
          <h1 className="text-xl mb-l">Resources</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="card bg-base-100 shadow-md">
              <div className="card-body gap-4 px-0">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-m">Uploaded Resources</h2>
                  <AddGroup onAdd={addResourceCollectionMutation.mutate} />
                </div>

                <ul className="menu bg-base-100 rounded-box w-full">
                  {resourceTree.map((resource) => (
                    <li key={resource._id}>
                      {resource.type === "collection" ? (
                        <details>
                          <summary
                            className={`flex items-center ${selectedResource?._id === resource._id ? "bg-base-200" : ""}`}
                            onClick={() => setSelectedResource(resource)}
                          >
                            <span className="text--1 truncate">
                              {resource.name}
                            </span>
                            <div className="flex items-center ml-auto">
                              <UploadButton
                                multiple={false}
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
                              >
                                <XIcon size={16} />
                              </button>
                            </div>
                          </summary>

                          <ul>
                            {resource.children.length === 0 && (
                              <li className="opacity-60 p-2">No files yet</li>
                            )}
                            {resource.children.map((child) => (
                              <li key={child._id}>
                                <div className="flex items-center justify-between">
                                  <a
                                    className={`min-w-0 flex-1 text--1 truncate ${child._id.startsWith("temp.") ? "text-primary" : ""}`}
                                    onClick={() => {
                                      if (!child._id.startsWith("temp."))
                                        setSelectedResource(child);
                                    }}
                                  >
                                    {child.name}
                                  </a>
                                  <button
                                    className="btn btn-phantom btn-xs px-0"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteResourceMutation.mutate(child._id);
                                    }}
                                    title="Delete file"
                                  >
                                    <XIcon size={16} />
                                  </button>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </details>
                      ) : (
                        <div className="flex items-center justify-between">
                          <a
                            className={`min-w-0 flex-1 text--1 truncate ${resource._id.startsWith("temp.") ? "text-primary" : ""}`}
                            onClick={() => {
                              if (!resource._id.startsWith("temp."))
                                setSelectedResource(resource);
                            }}
                          >
                            {resource.name}
                          </a>
                          <button
                            className="btn btn-phantom btn-xs px-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteResourceMutation.mutate(resource._id);
                            }}
                            title="Delete file"
                          >
                            <XIcon size={16} />
                          </button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="card col-span-2">
              <div className="card-body gap-4">
                {selectedResource ? (
                  <>
                    <StateConditionalMenu resource={selectedResource} />
                    {selectedResource.type === "file" && (
                      <ResourcePreview file={selectedResource} />
                    )}
                  </>
                ) : (
                  <span>Select a resource to show the preview</span>
                )}
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
          const file = e.target.files[0];
          onFiles(file);
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
