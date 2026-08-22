import React, { useRef, useState, createRef } from "react";
import { useParams, useHistory } from "react-router-dom";
import PropertyConditionalMenu from "../../components/Properties/PropertyConditionalMenu";
import {
  ArrowLeftIcon,
  FilePlusIcon,
  FileTextIcon,
  FolderPlusIcon,
  SearchIcon,
} from "lucide-react";
import { buildResourceTree, filterTreeBySearch, normaliseFile } from "./util";
import ResourcePreview from "./ResourcePreview";
import SkeletonBody from "./ResourcesSkeleton";
import PopoverInput from "./components/PopoverInput";
import { useResources } from "./useResources";
import { findById } from "../../util/search";
import EditableResourceTree from "./EditableResourceTree";

export default function ManageResourcesPage() {
  const { scenarioId } = useParams();
  const history = useHistory();
  const {
    resourcesQuery,
    addResourceCollectionMutation,
    addFileResourceMutation,
  } = useResources();

  const [selectedResourceId, setSelectedResourceId] = useState(null);
  const [search, setSearch] = useState("");

  const inputRef = createRef(null);
  const pendingParentIdRef = useRef(null);

  function goBack() {
    history.push(`/scenario/${scenarioId}`);
  }

  const resourceTree = buildResourceTree(resourcesQuery.data ?? []);
  const filteredTree = filterTreeBySearch(resourceTree, search);

  const foundResource = findById(resourcesQuery.data, selectedResourceId);
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
              <div className="min-h-[35dvh] min-w-0 overflow-hidden lg:h-full lg:min-h-0">
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

                  <ul className="menu min-h-0 w-full flex-1 overflow-auto p-0">
                    {search.trim() && filteredTree.length === 0 && (
                      <li className="p-2 opacity-60">
                        No matching resources found.
                      </li>
                    )}
                    <EditableResourceTree
                      tree={filteredTree}
                      selectedResourceId={selectedResourceId}
                      setSelectedResourceId={setSelectedResourceId}
                      pendingParentIdRef={pendingParentIdRef}
                      inputRef={inputRef}
                    />
                  </ul>
                </div>
              </div>

              {/* RIGHT: File list and preview */}
              <div className="card min-h-[60dvh] overflow-auto pb-[max(1rem,env(safe-area-inset-bottom))] lg:col-span-2 lg:h-full lg:min-h-0">
                <div className="card-body flex min-h-full flex-col gap-4 pr-0">
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
                    <div className="min-h-[50dvh] flex flex-1 flex-col gap-4 lg:min-h-0 justify-center items-center border-1 border-primary rounded-xl">
                      <FileTextIcon size={32} />
                      <span className="text--1">
                        Select a resource to show the preview
                      </span>
                    </div>
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
