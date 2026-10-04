import type { LucideIcon } from "lucide-react";
import { cn } from "../../../util/classnames";

interface PanelIconProps {
  label: string;
  Icon: LucideIcon;
  active: boolean;
  onClick: () => void;
}

/**
 * A single icon button in the side panel icon stack, purely presentational
 *
 * @component
 */
export default function PanelIcon({
  label,
  Icon,
  active,
  onClick,
}: PanelIconProps) {
  return (
    <button
      type="button"
      className="group relative z-30 cursor-pointer w-14 h-14 p-2 text-s"
      title={label}
      onClick={onClick}
      aria-expanded={active}
      aria-controls="canvas-side-panel"
      aria-label={label}
    >
      <span
        className={cn(
          "absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-sm transition-transform duration-100 ease group-hover:-translate-y-1",
          active ? "bg-base-300" : "bg-base-200"
        )}
      >
        <Icon size={20} />
      </span>
    </button>
  );
}
