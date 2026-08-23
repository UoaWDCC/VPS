import { isTemp } from "./util";
import EditableResourceListItem from "./EditableResourceListItem";

function EditableResourceTree({
  tree,
  selectedResourceId,
  setSelectedResourceId,
  pendingParentIdRef,
  inputRef,
}) {
  return (
    <>
      {tree.map((resource) => (
        <li key={resource._id} className="overflow-hidden">
          {resource.type === "collection" ? (
            <details className="overflow-hidden">
              <summary
                className={`flex items-center p-0 pr-3 w-full ${isTemp(resource) ? "text-primary" : ""} ${selectedResourceId === resource._id ? "bg-base-content/5" : ""}`}
                onClick={() =>
                  !isTemp(resource) && setSelectedResourceId(resource._id)
                }
              >
                <EditableResourceListItem
                  resource={resource}
                  selectedResourceId={selectedResourceId}
                  setSelectedResourceId={setSelectedResourceId}
                  isCollection={true}
                  pendingParentIdRef={pendingParentIdRef}
                  inputRef={inputRef}
                />
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
