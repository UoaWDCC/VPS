const DiamondPlayButton = ({ size = 100, onClick }) => {
  // Make size responsive to viewport
  const responsiveSize = `clamp(80px, ${size * 0.06}vw, ${size}px)`;

  return (
    <>
      <style>{`
        /* Diamond Play Button Styles */
        .diamond-play-button:hover {
          transform: scale(1.1);
        }

        .diamond-shape {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: black;
          border: 1px solid #374151;
          transform: rotate(45deg);
          transition: all 0.3s ease-out;
        }

        .diamond-play-button:hover .diamond-shape {
          box-shadow: 0 0px 32px 8px rgba(255, 255, 255, 0.20);
          border-color: white;
          background-color: white;
        }

        .diamond-play-button:active .diamond-shape {
          transform: rotate(45deg) scale(0.95);
        }

        .diamond-play-button:hover .play-text {
          color: black !important;
          text-shadow: 0 0 8px rgba(255, 255, 255, 0.8);
        }
      `}</style>
      <div
        className="diamond-play-button"
        onClick={onClick}
        style={{
          width: responsiveSize,
          height: responsiveSize,
          position: "relative",
          cursor: "pointer",
          userSelect: "none",
          transition: "all 0.3s ease-out",
        }}
      >
        {/* Diamond Shape */}
        <div
          className="diamond-shape"
          style={{
            transformOrigin: "center center",
          }}
        />

        {/* Play Text */}
        <div
          className="play-text"
          style={{
            fontSize: `clamp(12px, ${size * 0.012}vw, ${size * 0.2}px)`,
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontWeight: "bold",
            letterSpacing: "0.05em",
            transition: "all 0.2s ease-out",
            pointerEvents: "none",
            fontFamily: "var(--font-dm)",
          }}
        >
          LOG IN
        </div>
      </div>
    </>
  );
};

export default DiamondPlayButton;