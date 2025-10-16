const DiamondPlayButton = ({ size = 100, onClick }) => {
  // Make size responsive to viewport
  const responsiveSize = `clamp(80px, ${size * 0.06}vw, ${size}px)`;

  return (
    <>
      <style>{`
        /* Diamond login Button Styles */
        .diamond-login-button:hover {
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
          border-radius: 2px;
        }

        .diamond-login-button:hover .diamond-shape {
          box-shadow: 0 0px 32px 8px rgba(var(--color-base-content-rgb), 0.20);
          border-color: var(--color-base-content);
          background-color: var(--color-base-content);
        }

        .diamond-login-button:active .diamond-shape {
          transform: rotate(45deg) scale(0.95);
        }

        .diamond-login-button:hover .login-text {
          color: var(--color-base-100) !important;
          text-shadow: 0 0 8px rgba(var(--color-base-content-rgb), 0.8);
        }
      `}</style>
      <div
        className="diamond-login-button"
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
          className="login-text"
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
            color: "var(--color-base-content)",
            fontWeight: "regular",
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