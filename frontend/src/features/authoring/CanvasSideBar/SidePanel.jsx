import { XIcon } from "lucide-react";

/**
 * The single right-hand editing panel. It knows nothing about icons —
 * it just displays whatever `children` it's given whenever `open` is true.
 * @component
 */
export default function SidePanel({ label, open, onClose, children }) {
  if (!open) return null;

  return (
    <section
      id="canvas-side-panel"
      role="region"
      aria-label={label}
      className="h-full w-[24rem] min-w-[20rem] shrink-0 overflow-y-auto rounded-sm bg-base-200 p-5"
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold">{label}</h2>
        <button
          type="button"
          className="btn btn-ghost btn-xs btn-square"
          onClick={onClose}
          aria-label={`Close ${label} panel`}
        >
          <XIcon size={14} />
        </button>
      </div>
      {children}
    </section>
  );
}
