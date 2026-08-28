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
}

function EditableResourceListItem({
  resource,
  selectedResourceId,
  setSelectedResourceId,
}: ResourceListItemProps) {
  const { renameResourceMutation, deleteResourceMutation } = useResources();

  return (
    <ResourceNameField
      resource={resource}
      disabled={isTemp(resource) as boolean}
      onSelect={() => setSelectedResourceId(resource._id)}
      isSelected={selectedResourceId === resource._id}
      onRename={(name: string) =>
        (renameResourceMutation as UseMutationResult).mutate({
          resourceId: resource._id,
          name,
        })
      }
      actions={
        <button
          className="btn btn-phantom btn-xs px-1.5 h-full"
          onClick={(e) => {
            e.stopPropagation();
            (deleteResourceMutation as UseMutationResult).mutate(resource._id);
          }}
          title="Delete file"
          disabled={isTemp(resource) as boolean}
        >
          <XIcon size={16} />
        </button>
      }
    />
  );
}

export default EditableResourceListItem;
