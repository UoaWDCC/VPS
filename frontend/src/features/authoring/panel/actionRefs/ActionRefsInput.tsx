import {
  forwardRef,
  useImperativeHandle,
  useState,
  type ForwardedRef,
  type ReactElement,
} from "react";
import { generateKeyBetween } from "fractional-indexing";
import { v4 as uuid } from "uuid";
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
import type { ActionRef } from "../../types";
import useField from "../../inputs/useField";
import ActionRefRow from "./ActionRefRow";
import ActionRefRowDraft from "./ActionRefRowDraft";

interface ActionRefsInputProps {
  locator: string;
  component?: string | null;
}

export interface ActionRefsInputHandle {
  addItem: () => void;
}

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

function ActionRefsInput(
  { locator, component }: ActionRefsInputProps,
  ref: ForwardedRef<ActionRefsInputHandle>
) {
  const [hasDraft, setHasDraft] = useState(false);
  const [activeIdDragging, setActiveIdDragging] = useState<string | null>(null);

  const {
    props: { value, onChange },
  } = useField<ActionRef[]>(locator, {
    commit: "onChange",
    component: component,
    empty: [],
  });

  const sorted = orderRefs(value);

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
    const newIndex = sorted.findIndex((actionRef) => actionRef.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const moved = sorted[oldIndex];
    const others = sorted.filter((ref) => ref.id !== moved.id);
    const index = keyAt(others, newIndex);

    onChange(
      value.map((actionRef) =>
        actionRef.id === moved.id ? { ...actionRef, index } : actionRef
      )
    );
  }

  function handlePublish(actionId: string) {
    onChange([
      ...value,
      {
        id: uuid(),
        actionId,
        index: keyAt(sorted, sorted.length),
      },
    ]);
  }

  function handleScrap() {
    setHasDraft(false);
  }

  function handleDelete(id: string) {
    onChange(value.filter((ref) => ref.id !== id));
  }

  return (
    <DndContext
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      sensors={sensors}
      collisionDetection={closestCenter}
    >
      <SortableContext items={sorted} strategy={verticalListSortingStrategy}>
        <div className="dropdown flex-1">
          <ul>
            {sorted.map((actionRef, i) => (
              <ActionRefRow
                key={actionRef.id}
                id={actionRef.id}
                position={i}
                locator={`${locator}.${value.findIndex((r) => r.id === actionRef.id)}`}
                component={component}
                onDelete={handleDelete}
              />
            ))}
            {hasDraft && (
              <ActionRefRowDraft
                onPublish={handlePublish}
                onScrap={handleScrap}
              />
            )}
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

export default forwardRef(ActionRefsInput) as (
  props: ActionRefsInputProps & { ref?: ForwardedRef<ActionRefsInputHandle> }
) => ReactElement | null;
