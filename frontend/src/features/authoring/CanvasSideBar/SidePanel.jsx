import { useEffect, useRef, useState } from "react";
import { XIcon } from "lucide-react";

/**
 * The single right-hand editing panel. It knows nothing about icons —
 * it just displays whatever `children` it's given whenever `open` is true.
 *
 * On close, the parent's width transition keeps running after `open`
 * flips to false, so this keeps rendering its last content and fades
 * out over that same transition instead of vanishing immediately.
 * @component
 */
export default function SidePanel({ label, open, onClose, children }) {
  const [rendered, setRendered] = useState(open);
  const lastContentRef = useRef({ label, children });

  if (open) {
    lastContentRef.current = { label, children };
  }

  useEffect(() => {
    if (open) {
      setRendered(true);
      return;
    }
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reduceMotion) setRendered(false);
  }, [open]);

  if (!rendered) return null;

  const { label: renderedLabel, children: renderedChildren } =
    lastContentRef.current;

  return (
    <section
      id="canvas-side-panel"
      role="region"
      aria-label={renderedLabel}
      className={`h-full w-[24rem] min-w-[20rem] shrink-0 overflow-y-auto rounded-sm bg-base-200 p-5 transition-opacity duration-150 ease-out motion-reduce:transition-none ${
        open ? "opacity-100" : "opacity-0"
      }`}
      inert={!open}
      onTransitionEnd={(e) => {
        if (e.target === e.currentTarget && !open) setRendered(false);
      }}
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold">{renderedLabel}</h2>
        <button
          type="button"
          className="btn btn-ghost btn-xs btn-square"
          onClick={onClose}
          aria-label={`Close ${renderedLabel} panel`}
        >
          <XIcon size={14} />
        </button>
      </div>
      {renderedChildren}
    </section>
  );
}
