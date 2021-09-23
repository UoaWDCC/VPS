import React from "react";

function Thumbnail({
  url = "https://canvas.ac.nz/",
  iframeWidth = 2000,
  iframeHeight = 1500,
  width = 200,
  height = 150,
  interactive = false,
}) {
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

  return (
    <div style={outerWrapper}>
      <div style={iframeWrapper}>
        {!interactive && <div style={iframeShade}> </div>}
        <iframe
          tabIndex="-1"
          style={iframe}
          title="asdf"
          src={url}
          sandbox="allow-scripts allow-same-origin"
          scrolling="no"
        />
      </div>
    </div>
  );
}

export default Thumbnail;
