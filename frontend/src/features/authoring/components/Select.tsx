import { ChevronDown } from "lucide-react";
import { useEffect, useRef } from "react";

interface BaseSelectInputProps<T> {
  values: T[];
  value: T | null;
  display?: (v: T) => string;
  disabled?: boolean;
  autoFocus?: boolean;
  onBlur?: () => void;
}

// onChange only receives null when the "None" option is offered
type SelectInputProps<T> = BaseSelectInputProps<T> &
  (
    | { nullable: true; onChange: (v: T | null) => void }
    | { nullable?: false; onChange: (v: T) => void }
  );

function SelectInput<T>(props: SelectInputProps<T>) {
  const {
    values,
    value,
    display,
    disabled = false,
    autoFocus = false,
    onBlur,
  } = props;
  const render = display ?? ((v: T) => String(v));
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // only focus on mount, when this item is newly added
    if (autoFocus) triggerRef.current?.focus();
  }, []);

  function handleClick(v: T) {
    (document.activeElement as HTMLDivElement).blur();
    props.onChange(v);
  }

  function handleClear() {
    if (!props.nullable) return;
    (document.activeElement as HTMLDivElement).blur();
    props.onChange(null);
  }

  return (
    <div
      className={`dropdown flex-1 ${
        disabled ? "pointer-events-none opacity-50" : ""
      }`}
    >
      <div
        ref={triggerRef}
        tabIndex={0}
        role="button"
        onBlur={onBlur}
        className="justify-between input font-normal join-item w-full"
      >
        <span className="truncate">
          {value != null ? render(value) : "None"}
        </span>
        <ChevronDown className="shrink-0" size={16} />
      </div>
      {!disabled && (
        <ul
          tabIndex={0}
          onMouseDown={(e) => e.preventDefault()}
          className="dropdown-content menu bg-base-300 rounded-box z-1 w-70 p-2 shadow-sm"
        >
          {values.map((v, i) => (
            <li key={i}>
              <a
                onClick={() => handleClick(v)}
                className="block max-w-65 break-words overflow-hidden"
              >
                {render(v)}
              </a>
            </li>
          ))}
          {props.nullable ? (
            <li>
              <a onClick={handleClear}>None</a>
            </li>
          ) : null}
        </ul>
      )}
    </div>
  );
}

export default SelectInput;
