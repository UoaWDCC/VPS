import { forwardRef, useImperativeHandle, useState } from "react";
import type { Action, ActionRef } from "../types";
import useVisualScene from "../stores/visual";
import ActionRow from "./ActionRow";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";

interface ActionsInputProps {
  items: ActionRef[];
  onDelete: (id: string) => void;
  onReorder: (updated: ActionRef[]) => void;
}

export interface ActionsInputHandle {
  addItem: () => void;
}

function nextIndex(items: ActionRef[]) {
  return items.reduce((max, ref) => Math.max(max, ref.index), -1) + 1;
}

const ActionsInput = forwardRef<ActionsInputHandle, ActionsInputProps>(
  function ActionsInput({ items, onDelete, onReorder }, ref) {
    const actions = useVisualScene((s) => s.actions);
    const [hasDraft, setHasDraft] = useState(false);
    const [activeIdDragging, setActiveIdDragging] = useState<string | null>(null);

    const sorted = [...items].sort((a, b) => a.index - b.index);
    const rows = hasDraft
      ? [...sorted, { id: "", index: nextIndex(items) }]
      : sorted;

    const sensors = useSensors(
      useSensor(PointerSensor, {
        activationConstraint: {
          distance: 8,
        },
      }),
      useSensor(KeyboardSensor)
    );

    useImperativeHandle(ref, () => ({
      addItem() {
        setHasDraft(true);
      },
    }));

    function handleDragStart(e: DragStartEvent) {
      setActiveIdDragging(e.active.id as string);
    }

    function handleDragEnd(e: DragEndEvent) {
      setActiveIdDragging(null);

      const { active, over } = e;
      if (!over || active.id === over.id) return;

      const oldIndex = sorted.findIndex((actionRef) => actionRef.id === active.id);
      const newIndex = sorted.findIndex((actionRef) => actionRef.id === over.id);

      if (oldIndex === -1 || newIndex === -1) return;

      onReorder(
        arrayMove(sorted, oldIndex, newIndex).map((actionRef, index) => ({
          ...actionRef,
          index,
        }))
      );
    }

    function handleChange(id: string, action: Action | null) {
      if (id === "") {
        if (action) {
          onReorder([...items, { id: action.id, index: nextIndex(items) }]);
        }
        setHasDraft(false);
        return;
      }

      onReorder(
        items.map((actionRef) =>
          actionRef.id === id
            ? { ...actionRef, id: action?.id ?? actionRef.id }
            : actionRef
        )
      );
    }

    function handleBlur(id: string) {
      if (id === "") setHasDraft(false);
    }

    function handleDelete(id: string) {
      if (id === "") {
        setHasDraft(false);
        return;
      }
      onDelete(id);
    }

    return (
      <DndContext
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        sensors={sensors}
        collisionDetection={closestCenter}
      >
        <SortableContext items={rows} strategy={verticalListSortingStrategy}>
          <div className="dropdown flex-1">
            <ul>
              {rows.map((actionRef) => (
                <ActionRow
                  key={actionRef.id || "draft"}
                  actionRef={actionRef}
                  index={actionRef.index}
                  actions={actions}
                  onChange={(action) => handleChange(actionRef.id, action)}
                  onBlur={() => handleBlur(actionRef.id)}
                  onDelete={() => handleDelete(actionRef.id)}
                />
              ))}
            </ul>
          </div>
        </SortableContext>
        {/* NOTE: this is empty on purpose, since it acheives a no free-form drag overlay completely */}
        <DragOverlay dropAnimation={null}>
          {activeIdDragging ? <div></div> : null}
        </DragOverlay>
      </DndContext>
    );
  }
);

export default ActionsInput;
