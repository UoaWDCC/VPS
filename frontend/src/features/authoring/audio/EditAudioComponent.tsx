import { useEffect, useState } from "react";
import type { Component } from "../types";
import { remove } from "../scene/operations/modifiers";
import { modifyComponentProp } from "../scene/operations/component";

function EditAudioComponent({ component }: { component: Component }) {
  const [loop, setLoop] = useState<boolean>(component.loop);
  const [name, setName] = useState<string>(component.name);

  const [audio, setAudio] = useState(new Audio(component.url));
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (playing) audio.play();
    else audio.pause();
    return () => audio.pause();
  }, [playing]);

  useEffect(() => {
    audio.addEventListener("ended", () => setPlaying(false));
    return () => audio.removeEventListener("ended", () => setPlaying(false));
  }, [audio]);

  // useEffect(() => {
  //   if (stateOperation.operation !== operation) setOperation(stateOperation.operation);
  //   if (stateOperation.value !== value) setValue(stateOperation.value);
  // }, [stateOperation]);

  function togglePlayback() {
    setPlaying((prev) => !prev);
  }

  function deleteAudioComponent() {
    remove(component.id);
  }

  function saveName(v: string) {
    modifyComponentProp(component.id, "name", v);
  }

  function saveLoop(v: boolean) {
    setLoop(v);
    modifyComponentProp(component.id, "loop", v);
  }

  return (
    <div className="bg-base-300 mt-xs px-[1rem] py-[0.5rem] relative">
      <div className="absolute top-2 right-2">
        <button className="btn btn-xs btn-phantom" onClick={togglePlayback}>
          {playing ? "Pause" : "Play"}
        </button>
        <button
          className="btn btn-xs btn-phantom"
          onClick={deleteAudioComponent}
        >
          Delete
        </button>
      </div>
      <fieldset className="fieldset w-full mt-[0.5rem]">
        <label className="label">File Name</label>
        <input
          type={"text"}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Value"
          onBlur={() => saveName(name)}
          className="input"
        />
        <label className="label">
          <input
            type="checkbox"
            checked={loop}
            onChange={(e) => saveLoop(e.target.checked)}
            className="toggle"
          />
          Loop Audio
        </label>
      </fieldset>
    </div>
  );
}

export default EditAudioComponent;
