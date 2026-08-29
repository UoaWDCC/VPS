import { useEffect, useRef, useState } from "react";
import { Chrome } from "@uiw/react-color";

function ChromePicker({
  children,
  value,
  onChange,
  onOpen,
  tooltip,
  compact = false,
}: React.PropsWithChildren<{
  value: string;
  onChange: (value: string) => void;
  onOpen?: () => void;
  tooltip?: string;
  compact?: boolean;
}>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const prevBase = useRef<string | null>(null); // prev hex color

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick, true);
    return () => document.removeEventListener("mousedown", handleClick, true);
  }, []);

  const picker = open && (
    <div
      className={`z-20 absolute ${compact ? "right-0 top-full mt-2" : "top-[40px]"}`}
    >
      <Chrome
        color={value}
        onChange={(val) => {
          const color = val.hexa;
          const base = color.slice(0, 7);
          const isNewColor = prevBase.current !== base; // if new color is the same as prev only alpha changes then doesnt update alpha when its == 0
          prevBase.current = base;

          const fixedColour =
            isNewColor && color.slice(-2) === "00" ? `${base}ff` : color;

          onChange(fixedColour);
        }}
      />
    </div>
  );

  if (compact) {
    return (
      <div ref={ref} className="relative flex">
        <button
          type="button"
          className={`btn btn-sm gap-2 ${open ? "bg-base-100" : ""}`}
          aria-label={tooltip ?? "Choose colour"}
          onClick={() => {
            if (!open) onOpen?.();
            setOpen(!open);
          }}
        >
          <span
            className="size-4 rounded-xs border border-base-300"
            style={{ backgroundColor: value }}
          />
          <span className="font-mono text-xs uppercase">
            {value.slice(0, 7)}
          </span>
        </button>
        {picker}
      </div>
    );
  }

  return (
    <div ref={ref} style={{ position: "relative", display: "flex" }}>
      <li
        className={tooltip ? "tooltip tooltip-bottom" : undefined}
        data-tip={tooltip}
      >
        <a
          className={`${open && "bg-base-100"}`}
          onClick={() => setOpen(!open)}
        >
          <div
            className="relative size-[18px] border-b-3 flex justify-center items-center"
            style={{ borderBottomColor: value }}
          >
            {children}
          </div>
        </a>
      </li>
      {picker}
    </div>
  );
}

export default ChromePicker;
