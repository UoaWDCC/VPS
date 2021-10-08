import React from "react";
import ReactAudioPlayer from "react-audio-player";

function AudioComponent({ id, component }) {
  return (
    <ReactAudioPlayer
      id={id}
      src={`${component.url}`}
      autoPlay
      loop={!!component.loop}
    />
  );
}

export default AudioComponent;
