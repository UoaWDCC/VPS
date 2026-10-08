export default function PanelOverlay({ open, onClose }) {
  return (
    <div
      className={`fixed inset-0 z-50 bg-base-100/95 transition-opacity ${
        open
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none"
      }`}
      onClick={onClose}
      aria-hidden="true"
    />
  );
}
