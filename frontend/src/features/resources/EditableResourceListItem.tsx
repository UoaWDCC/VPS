import type React from "react";
import ResourceNameField from "./components/ResourceNameField";
import { isTemp } from "./util";
import { XIcon } from "lucide-react";
import { useResources } from "./useResources";
import type { UseMutationResult } from "@tanstack/react-query";

interface ResourceListItemProps {
  resource: {
    _id: string;
    name: string;
  };
  setSelectedResourceId: React.Dispatch<React.SetStateAction<string | null>>;
  selectedResourceId: string | null;
  pendingParentIdRef?: React.MutableRefObject<string>;
  inputRef?: React.MutableRefObject<HTMLInputElement>;
}

function EditableResourceListItem({
  resource,
  selectedResourceId,
  setSelectedResourceId,
}: ResourceListItemProps) {
  const { renameResourceMutation, deleteResourceMutation } = useResources() as {
    renameResourceMutation: UseMutationResult;
    deleteResourceMutation: UseMutationResult;
  };

  const isSelected = selectedResourceId === resource._id;

  function renameResource(name: string) {
    renameResourceMutation.mutate({ resourceId: resource._id, name });
  }

  return (
    <div
      className={`grid items-center overflow-hidden p-0 gap-0 w-full grid-cols-[minmax(0,1fr)_auto_auto] ${isSelected ? "bg-base-content/5" : ""}`}
    >
      <ResourceNameField
        name={resource.name}
        disabled={isTemp(resource) as boolean}
        onSelect={() => setSelectedResourceId(resource._id)}
        onRename={renameResource}
        actions={
          <>
            <button
              className="btn btn-phantom btn-xs px-1.5 h-full"
              onClick={(e) => {
                e.stopPropagation();
                deleteResourceMutation.mutate(resource._id);
              }}
              title="Delete file"
              disabled={isTemp(resource) as boolean}
            >
              <XIcon size={16} />
            </button>
          </>
        }
      />
    </div>
  );
}

export default EditableResourceListItem;
