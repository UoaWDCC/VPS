import ReactAudioPlayer from "react-audio-player";

/**
 * This component plays audio from a scene
 * @component
 */
function AudioComponent({ id, component }) {
  return (
    <ReactAudioPlayer
      id={id}
      src={component.url}
      autoPlay
      loop={!!component.loop}
    />
  );
}

export default AudioComponent;
