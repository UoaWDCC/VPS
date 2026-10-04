import { useEffect, useRef, useState, type ReactNode } from "react";
import { XIcon } from "lucide-react";
import { cn } from "../../../util/classnames";

interface PanelFrameProps {
  label?: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

/**
 * The right-hand editing panel.
 *
 * NOTE: On close, the parent's width transition keeps running after `open`
 * flips to false, so this keeps rendering its last content and fades
 * out instead of vanishing immediately.
 * @component
 */
export default function PanelFrame({
  label,
  open,
  onClose,
  children,
}: PanelFrameProps) {
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

  // @types/react 17 doesn't know the inert attribute, so it's spread in
  const inertProps = { inert: open ? undefined : "true" };

  return (
    <section
      id="canvas-side-panel"
      role="region"
      aria-label={renderedLabel}
      className={cn(
        "font-dm h-full w-[24rem] min-w-[20rem] shrink-0 overflow-y-auto rounded-sm bg-base-200 p-5 transition-opacity duration-150 ease-out motion-reduce:transition-none",
        !open && "opacity-0"
      )}
      {...inertProps}
      onTransitionEnd={(e) => {
        if (e.target === e.currentTarget && !open) setRendered(false);
      }}
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-m">{renderedLabel}</h2>
        <button
          type="button"
          className="btn btn-phantom btn-xs btn-square"
          onClick={onClose}
          aria-label={`Close ${renderedLabel} panel`}
        >
          <XIcon size={20} />
        </button>
      </div>
      {renderedChildren}
    </section>
  );
}
