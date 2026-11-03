import { useRef, useState, type KeyboardEvent } from "react";
import { MaximizeIcon, ZoomInIcon, ZoomOutIcon } from "lucide-react";
import useEditorStore, { MAX_ZOOM, MIN_ZOOM } from "../stores/editor";

function ZoomControls() {
  const zoom = useEditorStore((state) => state.zoom);
  const setZoom = useEditorStore((state) => state.setZoom);
  const zoomIn = useEditorStore((state) => state.zoomIn);
  const zoomOut = useEditorStore((state) => state.zoomOut);
  const resetZoom = useEditorStore((state) => state.resetZoom);

  // what has been typed so far, or null when the field just shows the zoom
  const [draft, setDraft] = useState<string | null>(null);
  const cancelled = useRef(false);

  function commit() {
    // parseFloat reads "69" and "69%" alike, and ignores anything unreadable
    if (!cancelled.current && draft !== null) setZoom(parseFloat(draft) / 100);
    cancelled.current = false;
    setDraft(null);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    } else if (e.key === "Escape") {
      cancelled.current = true;
      e.currentTarget.blur();
    }
  }

  return (
    <div className="absolute bottom-s right-s z-10 flex items-center gap-2 bg-base-300 shadow-sm px-2 py-1">
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          className="btn btn-phantom btn-square btn-sm tooltip tooltip-top"
          data-tip="Zoom out"
          aria-label="Zoom out"
          disabled={zoom <= MIN_ZOOM}
          onClick={zoomOut}
        >
          <ZoomOutIcon size={16} />
        </button>
        <input
          type="text"
          inputMode="numeric"
          className="input input-sm h-[28px] w-16 text-center text-xs tabular-nums"
          aria-label="Zoom level"
          value={draft ?? `${Math.round(zoom * 100)}%`}
          onFocus={(e) => e.target.select()}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={handleKeyDown}
        />
        <button
          type="button"
          className="btn btn-phantom btn-square btn-sm tooltip tooltip-top"
          data-tip="Zoom in"
          aria-label="Zoom in"
          disabled={zoom >= MAX_ZOOM}
          onClick={zoomIn}
        >
          <ZoomInIcon size={16} />
        </button>
      </div>
      <button
        type="button"
        className="btn btn-phantom btn-square btn-sm tooltip tooltip-top"
        data-tip="Reset zoom to 100%"
        aria-label="Reset zoom to 100%"
        onClick={resetZoom}
      >
        <MaximizeIcon size={16} />
      </button>
    </div>
  );
}

export default ZoomControls;
