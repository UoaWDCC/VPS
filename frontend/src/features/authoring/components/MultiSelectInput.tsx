import { CheckIcon, ChevronDown } from "lucide-react";

interface MultiSelectInputProps<T> {
  values: T[];
  selected: T[] | null;
  onChange: (v: T | null, state: boolean) => void;
  disabled?: boolean;
}

function MultiSelectInput<T>({
  values,
  selected,
  disabled = false,
  onChange,
}: MultiSelectInputProps<T>) {
  function handleClick(v: T | null, state: boolean) {
    (document.activeElement as HTMLDivElement).blur();
    onChange(v, state);
  }

  return (
    <div className="dropdown">
      <div
        tabIndex={0}
        role="button"
        className="justify-between input mb-1 font-normal w-full"
      >
        <span className="truncate">{selected?.join(", ") || "All"}</span>
        <ChevronDown className="shrink-0" size={16} />
      </div>
      {!disabled && (
        <ul
          tabIndex={0}
          className="dropdown-content menu bg-base-300 rounded-box z-1 w-full p-2 shadow-sm"
        >
          {values?.map((v, i) => {
            const active = selected?.includes(v);
            return (
              <li
                className={active ? "text-secondary" : "text-primary"}
                key={i}
              >
                <a onClick={() => handleClick(v, !active)}>
                  {v}
                  {active && <CheckIcon className="ml-auto" size={14} />}
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default MultiSelectInput;
