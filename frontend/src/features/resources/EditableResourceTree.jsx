import { PlusIcon, XIcon } from "lucide-react";
import { useResources } from "./useResources";
import { isTemp } from "./util";
import EditableResourceListItem from "./EditableResourceListItem";

function EditableResourceTree({
  tree,
  selectedResourceId,
  setSelectedResourceId,
  pendingParentIdRef,
  inputRef,
}) {
  const { deleteResourceMutation } = useResources();

  return (
    <>
      {tree.map((resource) => (
        <li key={resource._id} className="overflow-hidden">
          {resource.type === "collection" ? (
            <details className="overflow-hidden">
              <summary
                className={`flex items-center ${isTemp(resource) ? "text-primary" : ""} ${selectedResourceId === resource._id ? "bg-base-content/5" : ""}`}
                onClick={() =>
                  !isTemp(resource) && setSelectedResourceId(resource._id)
                }
              >
                <span className="text--1 truncate" title={resource.name}>
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
