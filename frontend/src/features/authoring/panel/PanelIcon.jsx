/**
 * A single icon button in the side panel icon stack. Purely presentational —
 * it just reports clicks via onClick, it has no knowledge of what (if
 * anything) is rendered in the panel itself.
 * @component
 */
export default function PanelIcon({ label, Icon, active, onClick }) {
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
        className={`absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-sm transition-transform duration-100 ease group-hover:-translate-y-1 ${
          active ? "bg-base-300" : "bg-base-200"
        }`}
      >
        <Icon size={20} />
      </span>
    </button>
  );
}
