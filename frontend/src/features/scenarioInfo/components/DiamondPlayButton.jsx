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
          background-color: var(--color-base-100);
          border: 1px solid var(--color-primary);
          transform: rotate(45deg);
          transition: all 0.3s ease-out;
        }

        .diamond-play-button:hover .diamond-shape {
          box-shadow: 0 10px 15px -3px rgba(var(--color-base-content-rgb), 0.3);
          border-color: var(--color-base-content);
          background-color: var(--color-base-content);
        }

        .diamond-play-button:active .diamond-shape {
          transform: rotate(45deg) scale(0.95);
        }

        .play-text {
          color: var(--color-base-content);
          transition: all 0.2s ease-out;
        }

        .diamond-play-button:hover .play-text {
          color: var(--color-base-100) !important;
          text-shadow: 0 0 8px rgba(var(--color-base-content-rgb), 0.3);
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
            fontWeight: "bold",
            letterSpacing: "0.05em",
            pointerEvents: "none",
            fontFamily: "var(--font-dm)",
          }}
        >
          PLAY
        </div>
      </div>
    </>
  );
};

export default DiamondPlayButton;
