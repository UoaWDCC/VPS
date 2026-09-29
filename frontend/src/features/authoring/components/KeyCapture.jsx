import { useEffect, useState } from "react";
import { normalizeEventKey, displayKeyBinding } from "../keyBindings";

/**
 * A "press a key to bind" control: click Set key, then press the key you
 * want. Only accepts keys present in availableKeys (already excludes keys
 * taken elsewhere) - anything else shows an inline error and keeps listening.
 * @component
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
      // Only one KeyCapture may claim a given keypress - without this, two
      // instances capturing at once (e.g. a component's and the scene's
      // direct-link picker) would both see the key as available and both
      // assign it from a single physical keystroke.
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
    <div className="flex items-center gap-2 flex-wrap">
      <button
        type="button"
        className="btn btn-sm [--btn-bg:var(--color-base-100)] [--btn-border:color-mix(in_oklab,var(--color-base-content)_20%,transparent)]"
        disabled={disabled}
        onClick={() => {
          setError(null);
          setCapturing(true);
        }}
      >
        {capturing
          ? "Press a key… (Esc to cancel)"
          : value
            ? `[${displayKeyBinding(value)}]`
            : "Set key"}
      </button>
      {value && !capturing && (
        <button
          type="button"
          className="btn btn-sm btn-ghost"
          disabled={disabled}
          onClick={() => onChange(clearValue)}
        >
          Clear
        </button>
      )}
      {error && <span className="text-error text-xs">{error}</span>}
    </div>
  );
}
