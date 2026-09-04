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
      className={`relative z-30 cursor-pointer hover:-translate-y-1 duration-100 ease w-14 h-14 p-2 flex flex-col items-center justify-center gap-1 rounded-sm text-s ${active ? "bg-base-300" : "bg-base-200"
        }`}
      onClick={onClick}
      aria-expanded={active}
      aria-controls="canvas-side-panel"
      aria-label={label}
    >
      <Icon size={20} />
    </button>
  );
}
