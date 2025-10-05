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
      <li><a className={`${open && "bg-base-100"}`} onClick={() => setOpen(!open)}>
        <div className="relative size-[18px] border-b-3 flex justify-center items-center" style={{ borderBottomColor: value }}>
          {children}
        </div>
      </a></li>
      {open && (
        <div ref={ref} className="z-1 absolute top-[40px]" >
          <Chrome color={value} onChange={(val) => onChange(val.hexa)} />
        </div>
      )}
    </div>
  );
}

export default ChromePicker;
