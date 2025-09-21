import React from 'react';
import './DiamondPlayButton.css';

const DiamondPlayButton = ({ size = 80 }) => {
  // Make size responsive to viewport
  const responsiveSize = `clamp(60px, ${size * 0.06}vw, ${size}px)`;
  
  return (
    <div
      className="diamond-play-button"
      style={{ 
        width: responsiveSize, 
        height: responsiveSize,
        position: 'relative',
        cursor: 'pointer',
        userSelect: 'none',
        transition: 'all 0.3s ease-out'
      }}
    >
      {/* Diamond Shape */}
      <div
        className="diamond-shape"
        style={{
          transformOrigin: 'center center',
        }}
      />
      
      {/* Play Text */}
      <div
        className="play-text"
        style={{
          fontSize: `clamp(12px, ${size * 0.012}vw, ${size * 0.2}px)`,
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 'bold',
          letterSpacing: '0.05em',
          transition: 'all 0.3s ease-out',
          pointerEvents: 'none'
        }}
      >
        PLAY
      </div>
    </div>
  );
};

export default DiamondPlayButton;
