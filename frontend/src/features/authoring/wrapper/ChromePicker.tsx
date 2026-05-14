import { useEffect, useRef, useState } from "react";
import { Chrome } from "@uiw/react-color";

function ChromePicker({
  children,
  value,
  onChange,
}: React.PropsWithChildren<{
  value: string;
  onChange: (value: string) => void;
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

  return (
    <div style={{ position: "relative", display: "flex" }}>
      <li>
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
              const isNewColor = prevBase.current !== base; // if new color is the same as prev only alpha changes then doesnt update alpha when its == 0 
              prevBase.current = base;

              const fixedColour =
                isNewColor && color.slice(-2) === "00" ? `${base}ff` : color;

              onChange(fixedColour);
            }}
          />
        </div>
      )}
    </div>
  );
}

export default ChromePicker;
