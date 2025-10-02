const DiamondPlayButton = ({ size = 80, onClick }) => {
  // Make size responsive to viewport
  const responsiveSize = `clamp(60px, ${size * 0.06}vw, ${size}px)`;

  return (
    <div
      onClick={onClick}
      style={{
        width: responsiveSize,
        height: responsiveSize,
        position: "relative",
        cursor: "pointer",
        userSelect: "none",
        transition: "all 0.3s ease-out",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "scale(1.1)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "scale(1)";
      }}
    >
      {/* Diamond Shape */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "black",
          border: "1px solid #374151",
          text: "white",
          transform: "rotate(45deg)",
          transformOrigin: "center center",
          transition: "all 0.3s ease-out",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = "0 10px 15px -3px rgba(255, 255, 255, 0.5)";
          e.currentTarget.style.borderColor = "white";
          e.currentTarget.style.backgroundColor = "white";
          e.currentTarget.style.text = "black";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = "none";
          e.currentTarget.style.borderColor = "#374151";
          e.currentTarget.style.backgroundColor = "black";
        }}
      />

      {/* Play Text */}
      <div
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
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "black";
          e.currentTarget.style.textShadow = "0 0 8px rgba(255, 255, 255, 0.8)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "white";
          e.currentTarget.style.textShadow = "none";
        }}
      >
        PLAY
      </div>
    </div>
  );
};

export default DiamondPlayButton;
