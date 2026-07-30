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

  function handleClick(v: T | null) {
    (document.activeElement as HTMLDivElement).blur();
    onChange(v);
  }

  return (
    <div
      className={`dropdown flex-1 ${
        disabled ? "pointer-events-none opacity-50" : ""
      }`}
    >
      <div
        tabIndex={0}
        role="button"
        className="justify-between input mb-1 font-normal join-item w-full"
      >
        <span className="truncate">
          {value != null ? render(value) : "None"}
        </span>
        <ChevronDown className="shrink-0" size={16} />
      </div>
      {!disabled && (
        <ul className="dropdown-content menu bg-base-300 rounded-box z-1 w-70 p-2 shadow-sm">
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
          {nullable ? (
            <li>
              <a onClick={() => handleClick(null)}>None</a>
            </li>
          ) : null}
        </ul>
      )}
    </div>
  );
}

export default SelectInput;
