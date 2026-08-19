import { ZoomInIcon, ZoomOutIcon } from "lucide-react";
import useEditorStore, { MAX_ZOOM, MIN_ZOOM } from "../stores/editor";

function ZoomControls() {
  const zoom = useEditorStore((state) => state.zoom);
  const zoomIn = useEditorStore((state) => state.zoomIn);
  const zoomOut = useEditorStore((state) => state.zoomOut);
  const resetZoom = useEditorStore((state) => state.resetZoom);

  return (
    <div className="absolute bottom-s right-s z-10 flex items-center gap-2 bg-base-300 shadow-sm px-2 py-1">
      <button
        type="button"
        className="btn btn-phantom btn-sm text-xs w-12 tabular-nums tooltip tooltip-top"
        data-tip="Reset zoom to 100%"
        onClick={resetZoom}
      >
        {Math.round(zoom * 100)}%
      </button>
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          className="btn btn-phantom btn-square btn-sm tooltip tooltip-top"
          data-tip="Zoom out"
          disabled={zoom <= MIN_ZOOM}
          onClick={zoomOut}
        >
          <ZoomOutIcon size={16} />
        </button>
        <button
          type="button"
          className="btn btn-phantom btn-square btn-sm tooltip tooltip-top"
          data-tip="Zoom in"
          disabled={zoom >= MAX_ZOOM}
          onClick={zoomIn}
        >
          <ZoomInIcon size={16} />
        </button>
      </div>
    </div>
  );
}

export default ZoomControls;
