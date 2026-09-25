import {
  forwardRef,
  useImperativeHandle,
  useState,
  type ForwardedRef,
  type ReactElement,
} from "react";
import { v4 } from "uuid";

interface ListItem {
  id: string;
}

export interface ListRowProps<T extends ListItem> {
  item: T;
  onChange: (item: T) => void;
  onBlur: () => void;
  onDelete: () => void;
}

interface ListInputProps<T extends ListItem> {
  items: T[];
  Row: (props: ListRowProps<T>) => ReactElement | null;
  onChange: (updated: T[]) => void;
  requiredField: keyof T;
}

export interface ListInputHandle {
  addItem: () => void;
}

function ListInput<T extends ListItem>(
  { items, onChange, requiredField, Row }: ListInputProps<T>,
  ref: ForwardedRef<ListInputHandle>
) {
  const [hasDraft, setHasDraft] = useState<boolean>(false);

  const rows = hasDraft ? [...items, { id: "" } as T] : items;

  useImperativeHandle(ref, () => ({
    addItem() {
      setHasDraft(true);
    },
  }));

  function handleBlur(id: string) {
    if (id === "") setHasDraft(false);
  }

  function handleDelete(id: string) {
    if (id === "") {
      setHasDraft(false);
      return;
    }
    onChange(items.filter((i) => i.id !== id));
  }

  function handleChange(item: T) {
    if (item.id === "") {
      // is draft
      if (item[requiredField]) onChange([...items, { ...item, id: v4() }]);
      setHasDraft(false);
      return;
    }
    onChange(items.map((i) => (i.id === item.id ? item : i)));
  }

  return (
    <div className="dropdown flex-1">
      <ul className="flex flex-col gap-1">
        {rows.map((item) => (
          <Row
            key={item.id || "draft"}
            item={item}
            onChange={handleChange}
            onBlur={() => handleBlur(item.id)}
            onDelete={() => handleDelete(item.id)}
          />
        ))}
      </ul>
    </div>
  );
}

export default forwardRef(ListInput) as <T extends ListItem>(
  props: ListInputProps<T> & { ref?: ForwardedRef<ListInputHandle> }
) => ReactElement | null;
