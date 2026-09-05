import { useEffect, useState } from "react";
import { Check } from "lucide-react";

const fonts = [
  "DM Sans",
  "IBM Plex Sans",
  "Mona Sans",
  "Inter",
  "Open Sans",
  "Roboto",
  "Lato",
  "Montserrat",
  "Poppins",
  "Source Sans 3",
  "Work Sans",
  "Fira Sans",
  "Space Grotesk",
  "Bebas Neue",
  "Oswald",
  "Playfair Display",
  "Merriweather",
  "Lora",
  "Libre Baskerville",
  "Cormorant Garamond",
  "Bitter",
  "Roboto Mono",
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

function findFonts(currentSearch = "") {
  const normalizedSearch = currentSearch.trim().toLowerCase();

  return normalizedSearch
    ? fonts.filter((font) => font.toLowerCase().includes(normalizedSearch))
    : fonts;
}

function findFont(fontName: string) {
  const normalizedFontName = fontName.trim().toLowerCase();
  return fonts.find((font) => font.toLowerCase() === normalizedFontName);
}

function FontInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [inputValue, setInputValue] = useState(value);
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const matchingFonts = findFonts(searchQuery);

  // Keep the display value in sync when the selected font changes elsewhere.
  useEffect(() => {
    setInputValue(value);
    setSearchQuery("");
  }, [value]);

  function restoreOrSelectFont() {
    const matchingFont = findFont(inputValue);

    if (matchingFont) {
      onChange(matchingFont);
      setInputValue(matchingFont);
    } else {
      setInputValue(value);
    }

    setSearchQuery("");
    setIsOpen(false);
  }

  return (
    <div className="relative">
      <input
        type="text"
        className="input input-sm h-[28px] w-30"
        placeholder="Search fonts..."
        value={inputValue}
        aria-label="Font family"
        aria-autocomplete="list"
        aria-controls="font-options"
        aria-expanded={isOpen}
        onFocus={() => {
          setSearchQuery("");
          setIsOpen(true);
        }}
        onBlur={restoreOrSelectFont}
        onChange={(event) => {
          setInputValue(event.target.value);
          setSearchQuery(event.target.value);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setInputValue(value);
            setSearchQuery("");
            setIsOpen(false);
          }

          if (event.key === "Enter") {
            event.currentTarget.blur();
          }
        }}
      />
      {isOpen && (
        <ul
          id="font-options"
          role="listbox"
          className="absolute left-0 top-full z-10 mt-1 flex max-h-60 min-w-48 max-w-60 flex-col overflow-y-auto rounded-box bg-base-300 shadow-sm"
        >
          {matchingFonts.map((font) => (
            <li key={font} role="option" aria-selected={font === value}>
              <button
                type="button"
                className={`flex w-full items-center justify-between px-3 py-1.5 text-left hover:bg-base-200 ${
                  font === value ? "bg-base-200" : ""
                }`}
                style={{ fontFamily: `"${font}", sans-serif` }}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onChange(font);
                  setInputValue(font);
                  setSearchQuery("");
                  setIsOpen(false);
                }}
              >
                {font}
                {font === value && <Check size={14} />}
              </button>
            </li>
          ))}
          {matchingFonts.length === 0 && (
            <li className="px-3 py-2 text-sm text-primary">No fonts found</li>
          )}
        </ul>
      )}
    </div>
  );
}

export default FontInput;
