import { isTemp } from "./util";
import EditableResourceListItem from "./EditableResourceListItem";
import ResourceNameField from "./components/ResourceNameField";
import { useResources } from "./useResources";
import { FilePlusIcon, XIcon } from "lucide-react";

function EditableResourceTree({
  tree,
  selectedResourceId,
  setSelectedResourceId,
  pendingParentIdRef,
  inputRef,
}) {
  const { renameResourceMutation, deleteResourceMutation } = useResources();

  function renameResource(resource, name) {
    renameResourceMutation.mutate({ resourceId: resource._id, name });
  }

  return (
    <>
      {tree.map((resource) => (
        <li key={resource._id} className="overflow-hidden">
          {resource.type === "collection" ? (
            <details className="overflow-hidden">
              <summary
                className={`flex items-center p-0 pr-3 w-full ${isTemp(resource) ? "text-primary" : ""} ${selectedResourceId === resource._id ? "bg-base-content/5" : ""}`}
              >
                <div className="flex-1 min-w-0">
                  <ResourceNameField
                    resource={resource}
                    disabled={isTemp(resource)}
                    onSelect={() => setSelectedResourceId(resource._id)}
                    isSelected={selectedResourceId === resource._id}
                    onRename={(name) => renameResource(resource, name)}
                    actions={
                      <>
                        <button
                          className="btn btn-phantom btn-xs px-1.5 h-full"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            deleteResourceMutation.mutate(resource._id);
                          }}
                          title="Delete collection"
                          disabled={isTemp(resource)}
                        >
                          <XIcon size={16} />
                        </button>
                        <button
                          className="btn btn-phantom btn-xs px-1.5 h-full"
                          disabled={isTemp(resource)}
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            pendingParentIdRef.current = resource._id;
                            inputRef.current?.click();
                          }}
                          title="Add file"
                        >
                          <FilePlusIcon size={16} />
                        </button>
                      </>
                    }
                  />
                </div>
              </summary>

              <ul className="overflow-hidden">
                {resource.children.length === 0 && (
                  <li className="opacity-60 p-2">No files yet</li>
                )}
                {resource.children.map((child) => (
                  <li key={child._id} className="overflow-hidden">
                    <EditableResourceListItem
                      resource={child}
                      selectedResourceId={selectedResourceId}
                      setSelectedResourceId={setSelectedResourceId}
                    />
                  </li>
                ))}
              </ul>
            </details>
          ) : (
            <EditableResourceListItem
              resource={resource}
              selectedResourceId={selectedResourceId}
              setSelectedResourceId={setSelectedResourceId}
            />
          )}
        </li>
      ))}
    </>
  );
}

export default EditableResourceTree;
