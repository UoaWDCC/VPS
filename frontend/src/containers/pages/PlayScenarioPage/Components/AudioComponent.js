import React from "react";
import ReactAudioPlayer from "react-audio-player";

function AudioComponent({ key, id, onClick, component }) {
  console.log(component);
  return <ReactAudioPlayer src="my_audio_file.ogg" autoPlay />;
}

export default AudioComponent;
