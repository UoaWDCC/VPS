import { CheckIcon, ChevronDown } from "lucide-react";
import type { FocusEvent } from "react";

interface MultiSelectInputProps<T> {
  options: T[];
  value: T[] | null;
  onChange: (value: T[] | null) => void;
  onBlur: () => void;
  disabled?: boolean;
}

function MultiSelectInput<T>({
  value,
  options,
  disabled = false,
  onChange,
  onBlur,
}: MultiSelectInputProps<T>) {
  function handleClick(option: T, state: boolean) {
    if (state) onChange([...(value ?? []), option]);
    else onChange(value?.filter((v) => v !== option) ?? null);
  }

  function handleBlur(e: FocusEvent<HTMLDivElement>) {
    if (e.currentTarget.contains(e.relatedTarget)) return;
    onBlur();
  }

  const label = value?.join(", ") || "All";

  return (
    <div className="dropdown w-full min-w-0" onBlur={handleBlur}>
      <div
        tabIndex={0}
        role="button"
        className="justify-between input mb-1 font-normal w-full"
      >
        <span className="truncate min-w-0 flex-1" title={label}>
          {label}
        </span>
        <ChevronDown className="shrink-0" size={16} />
      </div>
      {!disabled && (
        <ul
          tabIndex={0}
          className="dropdown-content menu bg-base-300 rounded-box z-1 w-full p-2 shadow-sm"
        >
          {options?.map((option, i) => {
            const active = value?.includes(option);
            return (
              <li
                className={active ? "text-secondary" : "text-primary"}
                key={i}
              >
                <a
                  className="min-w-0"
                  onClick={() => handleClick(option, !active)}
                >
                  <span
                    className="truncate min-w-0 flex-1"
                    title={String(option)}
                  >
                    {String(option)}
                  </span>
                  {active && (
                    <CheckIcon className="ml-auto shrink-0" size={14} />
                  )}
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
