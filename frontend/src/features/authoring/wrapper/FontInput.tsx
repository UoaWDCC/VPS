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
  const [fonts, setFonts] = useState(FontFinder());

  return (
    <div className="dropdown">
      <input
        type="text"
        className="input input-sm h-[28px] w-30"
        placeholder="Font Name"
        value={value}
        onChange={(e) => {
          setFonts(FontFinder(e.target.value));
          onChange(e.target.value);
        }}
      />
      <div
        tabIndex={0}
        className="dropdown-content z-1 top-[38px] w-32 max-h-35 bg-base-300 rounded-box shadow-sm overflow-y-auto"
      >
        {fonts.map((font, index) => (
          <div
            className="text-[0.8rem] pl-1 hover:bg-base-200 cursor-pointer w-32 mt-[2px] mb-[2px]"
            key={index}
            onClick={() => onChange(font)}
          >
            {font}
          </div>
        ))}
      </div>
    </div>
  );
}

export default FontInput;
