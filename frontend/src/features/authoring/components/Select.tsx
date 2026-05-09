interface SelectInputProps {
  values: any[];
  value: any;
  display?: (v: any) => string;
  onChange: (v: any) => void;
  nullable?: boolean;
}

function SelectInput({
  values,
  value,
  display,
  nullable = false,
  onChange,
}: SelectInputProps) {
  const render = display ?? ((v: any) => String(v));

  function handleClick(v: any) {
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
        className="dropdown-content menu bg-base-300 rounded-box z-1 w-52 p-2 shadow-sm"
      >
        {values.map((v: any, i: number) => (
          <li key={i}>
            <a onClick={() => handleClick(v)}>{render(v)}</a>
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
