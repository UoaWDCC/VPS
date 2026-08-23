import type React from "react";
import ResourceNameField from "./components/ResourceNameField";
import { isTemp } from "./util";
import { FilePlusIcon, XIcon } from "lucide-react";
import { useResources } from "./useResources";
import type { UseMutationResult } from "@tanstack/react-query";

interface ResourceListItemProps {
  resource: {
    _id: string;
    name: string;
  };
  setSelectedResourceId: React.Dispatch<React.SetStateAction<string | null>>;
  selectedResourceId: string | null;
  isCollection: boolean;
  pendingParentIdRef?: React.MutableRefObject<string>;
  inputRef?: React.MutableRefObject<HTMLInputElement>;
}

function EditableResourceListItem({
  resource,
  selectedResourceId,
  setSelectedResourceId,
  isCollection,
  pendingParentIdRef,
  inputRef,
}: ResourceListItemProps) {
  const { renameResourceMutation, deleteResourceMutation } = useResources();

  const isSelected = selectedResourceId === resource._id;

  return (
    <div
      className={`grid items-center overflow-hidden p-0 gap-0 w-full grid-cols-[minmax(0,1fr)_auto_auto_auto] ${isSelected && !isCollection ? "bg-base-content/5" : ""}`}
    >
      <ResourceNameField
        resource={resource}
        disabled={isTemp(resource) as boolean}
        onSelect={() => setSelectedResourceId(resource._id)}
        onRename={(name: string) =>
          (renameResourceMutation as UseMutationResult).mutate({
            resourceId: resource._id,
            name,
          })
        }
        actions={
          <>
            <button
              className="btn btn-phantom btn-xs px-1.5 h-full"
              onClick={(e) => {
                e.stopPropagation();
                (deleteResourceMutation as UseMutationResult).mutate(
                  resource._id
                );
              }}
              title={`Delete ${isCollection ? "collection" : "file"}`}
              disabled={isTemp(resource) as boolean}
            >
              <XIcon size={16} />
            </button>
            {isCollection && (
              <button
                className="btn btn-phantom btn-xs px-1.5"
                disabled={isTemp(resource) as boolean}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  pendingParentIdRef!.current = resource._id;
                  inputRef!.current?.click();
                }}
                title="Add file"
              >
                <FilePlusIcon size={16} />
              </button>
            )}
          </>
        }
      />
    </div>
  );
}

export default EditableResourceListItem;
