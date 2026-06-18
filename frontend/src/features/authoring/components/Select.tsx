interface SelectInputProps<T> {
  values: T[];
  value: T | null;
  display?: (v: T) => string;
  onChange: (v: T | null) => void;
  nullable?: boolean;
}

function SelectInput<T>({
  values,
  value,
  display,
  nullable = false,
  onChange,
}: SelectInputProps<T>) {
  const render = display ?? ((v: T) => String(v));

  function handleClick(v: T) {
    (document.activeElement as HTMLDivElement).blur();
    onChange(v);
  }

  return (
    <div className="dropdown flex-1">
      <div
        tabIndex={0}
        role="button"
        className="justify-start input mb-1 font-normal join-item w-full"
      >
        {value != null ? render(value) : "None"}
      </div>
      <ul
        tabIndex={0}
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
        {nullable ? (
          <li>
            <a onClick={() => onChange(null)}>None</a>
          </li>
        ) : null}
      </ul>
    </div>
  );
}

export default SelectInput;
