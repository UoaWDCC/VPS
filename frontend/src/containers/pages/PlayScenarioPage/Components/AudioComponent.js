import React from "react";
import ReactAudioPlayer from "react-audio-player";

function AudioComponent({ id, component }) {
  // (window.location === window.parent.location) is true if it's not inside of an iframe
  return (
    window.location === window.parent.location && (
      <ReactAudioPlayer
        muted={!!(window.location !== window.parent.location)}
        id={id?.toString()}
        src={`${component.url}`}
        autoPlay
        loop={!!component.loop}
      />
    )
  );
}

export default AudioComponent;
