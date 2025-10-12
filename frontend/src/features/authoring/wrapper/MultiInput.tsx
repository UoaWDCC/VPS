import type { ReactElement } from "react";

type MultiInputProps = React.PropsWithChildren<{
  value: string | number;
  values: MultiInputProps["value"][];
  items?: ReactElement[];
  onChange: (value: MultiInputProps["value"]) => void;
}>;

function MultiInput({
  value,
  values,
  items,
  onChange,
  children,
}: MultiInputProps) {
  return (
    <div className="dropdown">
      <li>
        <a tabIndex={0}>{children}</a>
      </li>
      <ul
        tabIndex={0}
        className="dropdown-content menu menu-horizontal bg-base-300 gap-0.5 rounded-box z-1 p-2 shadow-sm top-[38px] w-max"
      >
        {values.map((v, i) => (
          <li key={i}>
            <a
              className={`${v === value && "bg-base-100"} h-[28px] min-w-[28px] flex items-center justify-center`}
              onClick={() => onChange(v)}
            >
              {items ? items[i] : v}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default MultiInput;
