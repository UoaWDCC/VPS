import { XIcon } from "lucide-react";

export default function SidePanel({
  label,
  Icon,
  open,
  onToggle,
  children,
}) {
  return (
    <div className="flex w-full justify-end">
      {open && (
        <section className="absolute top-0 bottom-4 left-0 right-[6.5rem] z-20 overflow-y-auto rounded-sm bg-base-200 p-3 shadow-lg">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">{label}</h2>
            <button
              type="button"
              className="btn btn-ghost btn-xs btn-square"
              onClick={onToggle}
              aria-label={`Close ${label} panel`}
            >
              <XIcon size={14} />
            </button>
          </div>
          {children}
        </section>
      )}

      <button
        type="button"
        className={`w-24 h-24 p-2 flex flex-col items-center justify-center gap-1 rounded-sm text-s ${
          open ? "bg-base-100" : "bg-base-300"
        }`}
        onClick={onToggle}
        aria-expanded={open}
        aria-label={label}
      >
        <Icon size={30} />
        <span className="text-xs text-center">{label}</span>
      </button>
    </div>
  );
}
