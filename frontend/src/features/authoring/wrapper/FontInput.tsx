import { useState } from "react";

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

  return (
    <>
      <input
        type="text"
        className="input input-sm h-[28px] w-30 relative"
        placeholder="Font Name"
        value={value}
        onChange={(e) => {
          setFonts(FontFinder(e.target.value));
          onChange(e.target.value);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      />
      {open && (
        <div className={"fixed top-0 left-0 w-full h-full"}>
          <select
            className={"absolute top-0 left-0 w-full h-full"}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          >
            {fonts.map((font, index) => (
              <option key={index}>{font}</option>
            ))}
          </select>
        </div>
      )}
    </>
  );
}

export default FontInput;
