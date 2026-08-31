import { useEffect } from "react";
import PanelOverlay from "./PanelOverlay";

export default function StartAudioPanel({
  open,
  onClose,
  setAudioMuted,
  playAudios,
}) {
  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <>
      <PanelOverlay open={open} onClose={() => {}} />

      <div
        className={`fixed inset-0 z-50 flex items-center justify-center transition-all ${
          open
            ? "opacity-100 scale-100 pointer-events-auto"
            : "opacity-0 scale-95 pointer-events-none"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Resources"
        onClick={onClose}
      >
        <div className="flex flex-col gap-4">
          <button
            className="btn"
            onClick={() => {
              setAudioMuted(false);
              playAudios();
              onClose();
            }}
            aria-label="Unmute audio"
            title="Unmute audio"
          >
            Start with audio on
          </button>
          <button
            className="btn"
            onClick={() => {
              setAudioMuted(true);
              playAudios();
              onClose();
            }}
            aria-label="Mute audio"
            title="Mute audio"
          >
            Start with audio muted
          </button>
        </div>
      </div>
    </>
  );
}
