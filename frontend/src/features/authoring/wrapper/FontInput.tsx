import { useState, useEffect } from "react";
import { Check } from "lucide-react";

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
  const [searchQuery, setSearchQuery] = useState("");
  const fonts = FontFinder(searchQuery);

  // Reset search query when the selected value changes externally
  useEffect(() => {
    setSearchQuery("");
  }, [value]);

  return (
    <div className="dropdown">
      <input
        type="text"
        className="input input-sm h-[28px] w-30"
        placeholder="Search fonts..."
        value={searchQuery || value}
        onChange={(e) => {
          setSearchQuery(e.target.value);
        }}
      />
      <ul
        tabIndex={0}
        className="dropdown-content menu menu-sm flex-nowrap bg-base-300 rounded-box shadow-sm min-w-30 w-max max-w-60 max-h-60 overflow-y-auto"
      >
        {fonts.map((font, index) => (
          <li key={index}>
            <button
              type="button"
              className={`justify-between ${font === value ? "menu-active" : ""}`}
              onClick={() => {
                onChange(font);
                setSearchQuery("");
              }}
            >
              {font}
              {font === value && <Check size={14} />}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default FontInput;
