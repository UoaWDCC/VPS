import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

function FontFinder(currentSearch: string = "") {
  const fonts = [
    "Arial",
    "Verdana",
    "Tahoma",
    "Trebuchet MS",
    "Times New Roman",
    "Georgia",
    "Garamond",
    "Courier New",
    "Helvetica",
  ];

  const filteredFonts =
    currentSearch.length == 0
      ? fonts
      : fonts.filter((font) =>
          font.toLowerCase().includes(currentSearch.toLowerCase())
        );

  return filteredFonts;
}

function FontInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [fonts, setFonts] = useState(FontFinder());
  const inputRef = useRef<HTMLInputElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useLayoutEffect(() => {
    if (!open || !inputRef.current) return;
    const rect = inputRef.current.getBoundingClientRect();
    setPosition({ top: rect.bottom, left: rect.left });
  }, [open]);

  const portal = document.getElementById("modal-portal");

  return (
    <>
      <input
        ref={inputRef}
        type="text"
        className="input input-sm h-[28px] w-30 relative"
        placeholder="Font Name"
        value={value}
        onChange={(e) => {
          setFonts(FontFinder(e.target.value));
          onChange(e.target.value);
        }}
        onFocus={() => setOpen(true)}
      />
      {open &&
        portal &&
        createPortal(
          <div
            className="absolute w-32 h-30 bg-base-300 rounded-box shadow-sm overflow-y-auto pointer-events-auto"
            style={{ top: position.top + 10, left: position.left - 4 }}
          >
            {fonts.map((font, index) => (
              <div
                className="text-[0.8rem] pl-1 hover:bg-base-200 cursor-pointer w-32"
                key={index}
                onMouseDown={() => {
                  onChange(font);
                  setOpen(false);
                }}
              >
                {font}
              </div>
            ))}
          </div>,
          portal
        )}
    </>
  );
}

export default FontInput;
