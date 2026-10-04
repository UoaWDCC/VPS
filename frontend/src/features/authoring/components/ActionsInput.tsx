import { forwardRef, useImperativeHandle, useState } from "react";
import { generateKeyBetween } from "fractional-indexing";
import { v4 as uuid } from "uuid";
import type { Action, ActionRef } from "../types";
import useVisualScene from "../stores/visual";
import ActionRow from "./ActionRow";
import {
  SortableContext,
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
  value: ActionRef[];
  onChange: (value: ActionRef[]) => void;
}

export interface ActionsInputHandle {
  addItem: () => void;
}

const DRAFT: ActionRef = { id: "", actionId: "", index: "" };

// fractional index keys must be compared by code unit
function compareKeys(a: string, b: string) {
  return a < b ? -1 : a > b ? 1 : 0;
}

// ties are only possible from concurrent edits, and are broken by ref id
function orderRefs(refs: ActionRef[]) {
  return [...refs].sort(
    (a, b) => compareKeys(a.index, b.index) || compareKeys(a.id, b.id)
  );
}

// a key placing a ref at position `at` of `others` (sorted, without the ref)
function keyAt(others: ActionRef[], at: number) {
  const prev = others[at - 1]?.index ?? null;
  // refs sharing prev's key can't have anything placed between them
  const next =
    others.slice(at).find((ref) => prev === null || ref.index > prev)?.index ??
    null;
  return generateKeyBetween(prev, next);
}

const ActionsInput = forwardRef<ActionsInputHandle, ActionsInputProps>(
  function ActionsInput({ value, onChange }, ref) {
    const actions = useVisualScene((s) => s.actions);
    const [hasDraft, setHasDraft] = useState(false);
    const [activeIdDragging, setActiveIdDragging] = useState<string | null>(
      null
    );

    const items = value;
    const sorted = orderRefs(items);
    const rows = hasDraft ? [...sorted, DRAFT] : sorted;

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

      const oldIndex = sorted.findIndex(
        (actionRef) => actionRef.id === active.id
      );
      const newIndex = sorted.findIndex(
        (actionRef) => actionRef.id === over.id
      );

      if (oldIndex === -1 || newIndex === -1) return;

      const moved = sorted[oldIndex];
      const others = sorted.filter((ref) => ref.id !== moved.id);
      const index = keyAt(others, newIndex);

      onChange(
        items.map((actionRef) =>
          actionRef.id === moved.id ? { ...actionRef, index } : actionRef
        )
      );
    }

    function handleChange(id: string, action: Action | null) {
      if (id === "") {
        if (action) {
          onChange([
            ...items,
            {
              id: uuid(),
              actionId: action.id,
              index: keyAt(sorted, sorted.length),
            },
          ]);
        }
        setHasDraft(false);
        return;
      }

      onChange(
        items.map((actionRef) =>
          actionRef.id === id
            ? { ...actionRef, actionId: action?.id ?? actionRef.actionId }
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
      onChange(items.filter((ref) => ref.id !== id));
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
              {rows.map((actionRef, i) => (
                <ActionRow
                  key={actionRef.id || "draft"}
                  actionRef={actionRef}
                  index={i}
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
