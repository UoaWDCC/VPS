import {
  forwardRef,
  useImperativeHandle,
  useState,
  type ForwardedRef,
  type ReactElement,
} from "react";
import useField from "../../inputs/useField";

interface ListItem {
  id: string;
}

interface ListRowProps {
  locator: string;
  id: string;
  onDelete: (id: string) => void;
}

interface ListRowDraftProps<T extends ListItem> {
  onPublish: (item: T) => void;
  onScrap: () => void;
}

interface ListInputProps<T extends ListItem> {
  locator: string;
  Row: (props: ListRowProps) => ReactElement | null;
  DraftRow: (props: ListRowDraftProps<T>) => ReactElement | null;
}

export interface ListInputHandle {
  addItem: () => void;
}

function ListInput<T extends ListItem>(
  { locator, Row, DraftRow }: ListInputProps<T>,
  ref: ForwardedRef<ListInputHandle>
) {
  const [hasDraft, setHasDraft] = useState<boolean>(false);

  const {
    props: { value, onChange },
  } = useField<T[]>(locator, { commit: "onChange", empty: [] });

  useImperativeHandle(ref, () => ({
    addItem() {
      setHasDraft(true);
    },
  }));

  function handleDelete(id: string) {
    onChange(value.filter((i) => i.id !== id));
  }

  function handlePublish(item: T) {
    onChange([...value, item]);
  }

  function handleScrap() {
    setHasDraft(false);
  }

  return (
    <div className="dropdown flex-1">
      <ul className="flex flex-col gap-1">
        {value.map((item, i) => (
          <Row
            key={item.id}
            id={item.id}
            locator={`${locator}.${i}`}
            onDelete={() => handleDelete(item.id)}
          />
        ))}
        {hasDraft && (
          <DraftRow onPublish={handlePublish} onScrap={handleScrap} />
        )}
      </ul>
    </div>
  );
}

export default forwardRef(ListInput) as <T extends ListItem>(
  props: ListInputProps<T> & { ref?: ForwardedRef<ListInputHandle> }
) => ReactElement | null;
