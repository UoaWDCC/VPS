import { useState } from "react";
import Skeleton from "react-loading-skeleton";

/**
 * Component used for thumbnails.
 *
 * @component
 * @example
 * const url = "https://canvas.ac.nz/"
 * const interactive = false
 * function onLoad() {
 *   console.log("Loading...")
 * }
 * return (
 *   <Thumbnail url={url} interactive={interactive} onLoad={onLoad} />
 * )
 */
function Thumbnail({
  url = "https://canvas.ac.nz/",
  iframeWidth = 1920,
  iframeHeight = 1080,
  width = 266,
  height = 150,
  interactive = false,
  style: customStyle,
  onLoad,
}) {
  const [loading, setLoading] = useState(true);

  const xscale = width / iframeWidth;
  const yscale = height / iframeHeight;
  const iframe = {
    transform: `scaleX(${xscale}) scaleY(${yscale})`,
    transformOrigin: "0 0",
    width: `${iframeWidth}px`,
    height: `${iframeHeight}px`,
    border: "0px",
  };

  const iframeShade = {
    position: "absolute",
    width: "100%",
    height: `${height}px`,
    maxWidth: `${width}px`,
    zIndex: "10",
  };

  const iframeWrapper = {
    maxWidth: `${width}px`,
    maxHeight: `${height}px`,
    backgroundColor: "white",
    filter: "drop-shadow(1px 1px 2px grey)",
  };

  const outerWrapper = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%",
  };

  /** Function which executes while the thumbnail is loading. */
  const combinedOnLoad = () => {
    if (onLoad) {
      onLoad();
    }
    setLoading(false);
  };

  return (
    <div
      style={{ ...outerWrapper, ...customStyle }}
      data-testid="div-outer-wrapper"
    >
      <div style={iframeWrapper} data-testid="div-iframe-wrapper">
        {!interactive && <div style={iframeShade}> </div>}
        {loading && (
          <Skeleton
            style={{ position: "absolute", zIndex: "15" }}
            width={width}
            height={height}
            duration={0.8}
          />
        )}
        <iframe
          tabIndex="-1"
          style={iframe}
          title="webpage-thumbnail"
          src={url}
          sandbox="allow-scripts allow-same-origin"
          scrolling="no"
          onLoad={combinedOnLoad}
        />
      </div>
    </div>
  );
}
// TODO write proptypes
export default Thumbnail;
