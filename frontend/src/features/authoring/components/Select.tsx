import {
  useEffect,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
} from "react";
import { ChevronDown } from "lucide-react";

interface SelectInputProps<T> {
  values: T[];
  value: T | null;
  display?: (v: T) => string;
  onChange: (v: T | null) => void;
  nullable?: boolean;
  disabled?: boolean;
}

function SelectInput<T>({
  values,
  value,
  display,
  nullable = false,
  disabled = false,
  onChange,
}: SelectInputProps<T>) {
  const render = display ?? ((v: T) => String(v));
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const selectedIndex =
    value == null ? (nullable ? values.length : -1) : values.indexOf(value);
  const optionCount = values.length + (nullable ? 1 : 0);

  useEffect(() => {
    if (open) optionRefs.current[activeIndex]?.focus();
  }, [activeIndex, open]);

  function openMenu(index = selectedIndex >= 0 ? selectedIndex : 0) {
    if (disabled || optionCount === 0) return;
    setActiveIndex(index);
    setOpen(true);
  }

  function selectOption(index: number) {
    onChange(index < values.length ? values[index] : null);
    setOpen(false);
    triggerRef.current?.focus();
  }

  function handleBlur(event: FocusEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setOpen(false);
    }
  }

  function handleTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (open) setOpen(false);
      else openMenu();
      return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      openMenu(
        event.key === "ArrowUp" && selectedIndex < 0
          ? optionCount - 1
          : undefined
      );
    }
  }

  function handleOptionKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number
  ) {
    let nextIndex = index;

    switch (event.key) {
      case "Enter":
      case " ":
        event.preventDefault();
        selectOption(index);
        return;
      case "ArrowDown":
        nextIndex = (index + 1) % optionCount;
        break;
      case "ArrowUp":
        nextIndex = (index - 1 + optionCount) % optionCount;
        break;
      case "Home":
        nextIndex = 0;
        break;
      case "End":
        nextIndex = optionCount - 1;
        break;
      case "Escape":
        event.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
        return;
      default:
        return;
    }

    event.preventDefault();
    setActiveIndex(nextIndex);
  }

  return (
    <div
      className={`dropdown flex-1 ${open ? "dropdown-open" : ""} ${
        disabled ? "pointer-events-none opacity-50" : ""
      }`}
      onBlur={handleBlur}
    >
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={handleTriggerKeyDown}
        className="justify-between input mb-1 font-normal join-item w-full"
      >
        <span className="truncate">
          {value != null ? render(value) : "None"}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          size={16}
        />
      </button>
      {!disabled && open && (
        <ul
          role="listbox"
          className="dropdown-content menu bg-base-300 rounded-box z-1 w-70 p-2 shadow-sm"
        >
          {values.map((v, i) => (
            <li key={i} role="none">
              <button
                ref={(element) => {
                  optionRefs.current[i] = element;
                }}
                type="button"
                role="option"
                tabIndex={-1}
                aria-selected={value === v}
                onClick={() => selectOption(i)}
                onKeyDown={(event) => handleOptionKeyDown(event, i)}
                className="block max-w-65 break-words overflow-hidden"
              >
                {render(v)}
              </button>
            </li>
          ))}
          {nullable ? (
            <li role="none">
              <button
                ref={(element) => {
                  optionRefs.current[values.length] = element;
                }}
                type="button"
                role="option"
                tabIndex={-1}
                aria-selected={value == null}
                onClick={() => selectOption(values.length)}
                onKeyDown={(event) => handleOptionKeyDown(event, values.length)}
              >
                None
              </button>
            </li>
          ) : null}
        </ul>
      )}
    </div>
  );
}

export default SelectInput;
