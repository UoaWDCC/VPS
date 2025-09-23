import { useEffect, useRef, useState } from "react";
import { Chrome } from "@uiw/react-color";

function ChromePicker({
  children,
  value,
  onChange
}: React.PropsWithChildren<{ value: string, onChange: (value: string) => void }>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

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
      <button className="button" onClick={() => setOpen(!open)}>
        <div className="color-input" style={{ borderBottomColor: value }}>
          {children}
        </div>
      </button>
      {open && (
        <div ref={ref} style={{ position: "absolute", top: "40px" }}>
          <Chrome color={value} onChange={(val) => onChange(val.hexa)} />
        </div>
      )}
    </div>
  );
}

export default ChromePicker;
