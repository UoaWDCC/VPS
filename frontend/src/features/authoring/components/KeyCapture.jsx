import { useEffect, useState } from "react";
import { KeyboardIcon, XIcon } from "lucide-react";
import { normalizeEventKey, displayKeyBinding } from "../keyBindings";

/**
 * Click "Set key", then press a key from availableKeys to bind it.
 * @component
 * @param {{
 *   value: string | null,
 *   availableKeys: string[],
 *   onChange: (key: string | null) => void,
 *   disabled?: boolean,
 *   clearValue?: string | null,
 * }} props
 */
export default function KeyCapture({
  value,
  availableKeys,
  onChange,
  disabled = false,
  clearValue = null,
}) {
  const [capturing, setCapturing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!capturing) return;

    function handleKeyDown(e) {
      e.preventDefault();
      e.stopPropagation();
      // stop another open KeyCapture from claiming the same keypress
      e.stopImmediatePropagation();

      if (e.key === "Escape") {
        setCapturing(false);
        setError(null);
        document.activeElement?.blur();
        return;
      }

      const key = normalizeEventKey(e);
      if (!key) return;

      if (!availableKeys.includes(key)) {
        setError(`${displayKeyBinding(key)} is already in use`);
        return;
      }

      onChange(key);
      setCapturing(false);
      setError(null);
      document.activeElement?.blur();
    }

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [capturing, availableKeys, onChange]);

  return (
    <div className="flex flex-1 flex-wrap items-center gap-2">
      <button
        type="button"
        className="btn btn-panel"
        disabled={disabled}
        onClick={() => {
          setError(null);
          setCapturing(true);
        }}
      >
        <KeyboardIcon size={18} />
        {capturing
          ? "Press a key… (Esc to cancel)"
          : value
            ? `[${displayKeyBinding(value)}]`
            : "Set key"}
      </button>
      {value && !capturing && (
        <button
          type="button"
          className="btn btn-panel"
          disabled={disabled}
          onClick={() => onChange(clearValue)}
        >
          <XIcon size={18} />
          Clear
        </button>
      )}
      {error && <span className="text-error text-xs basis-full">{error}</span>}
    </div>
  );
}
