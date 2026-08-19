import { useEffect, useRef, useState } from "react";
import { Chrome } from "@uiw/react-color";

function ChromePicker({
  children,
  value,
  onChange,
  onPreview,
  tooltip,
}: React.PropsWithChildren<{
  value: string;
  onChange: (value: string) => void;
  onPreview?: (value: string) => void;
  tooltip?: string;
}>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const prevBase = useRef<string | null>(null);

  const latestColour = useRef(value);
  const committedColour = useRef(value);
  const hasPendingChange = useRef(false);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!hasPendingChange.current) {
      latestColour.current = value;
      committedColour.current = value;
    }
  }, [value]);

  useEffect(() => {
    function commitPendingColour() {
      if (!hasPendingChange.current) return;

      const colour = latestColour.current;

      if (colour !== committedColour.current) {
        onChangeRef.current(colour);
        committedColour.current = colour;
      }

      hasPendingChange.current = false;
    }

    function handleClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        commitPendingColour();
        setOpen(false);
      }
    }

    function handlePointerUp() {
      if (open) {
        commitPendingColour();
      }
    }

    document.addEventListener("mousedown", handleClick, true);
    document.addEventListener("pointerup", handlePointerUp);

    return () => {
      document.removeEventListener("mousedown", handleClick, true);
      document.removeEventListener("pointerup", handlePointerUp);
    };
  }, [open]);

  return (
    <div style={{ position: "relative", display: "flex" }}>
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

      {open && (
        <div ref={ref} className="z-1 absolute top-[40px]">
          <Chrome
            color={value}
            onChange={(val) => {
              const color = val.hexa;
              const base = color.slice(0, 7);
              const isNewColor = prevBase.current !== base;

              prevBase.current = base;

              const fixedColour =
                isNewColor && color.slice(-2) === "00" ? `${base}ff` : color;

              latestColour.current = fixedColour;
              hasPendingChange.current = true;
              onPreview?.(fixedColour);
            }}
          />
        </div>
      )}
    </div>
  );
}

export default ChromePicker;
