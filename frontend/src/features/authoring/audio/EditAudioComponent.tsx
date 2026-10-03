import { useEffect, useState } from "react";
import { remove } from "../scene/operations/modifiers";
import { modifyComponentProp } from "../scene/operations/component";
import type { AudioComponent } from "../types";
import { PauseIcon, PlayIcon, RepeatIcon, XIcon } from "lucide-react";
import { cn } from "../../../util/classnames";

function EditAudioComponent({ component }: { component: AudioComponent }) {
  const [loop, setLoop] = useState<boolean>(component.loop);
  const [name, setName] = useState<string>(component.name);

  const [audio] = useState(new Audio(component.url));
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (playing) void audio.play();
    else audio.pause();
    return () => audio.pause();
  }, [playing]);

  useEffect(() => {
    const onEnded = () => setPlaying(false);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("ended", onEnded);
      audio.pause();
      audio.src = "";
      audio.load();
    };
  }, [audio]);

  function togglePlayback() {
    setPlaying((prev) => !prev);
  }

  function deleteAudioComponent() {
    remove([component.id]);
  }

  function saveName(v: string) {
    modifyComponentProp([component.id], "name", v);
  }

  function saveLoop(v: boolean) {
    setLoop(v);
    modifyComponentProp([component.id], "loop", v);
  }

  return (
    <li>
      <div className="flex items-center">
        <button
          className="btn btn-phantom btn-square btn-xs"
          onClick={togglePlayback}
          title="Toggle Audio Playback"
          aria-label="toggle audio playback"
        >
          {playing ? <PauseIcon size={20} /> : <PlayIcon size={20} />}
        </button>
        <div className="flex items-center join flex-1">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Value"
            onBlur={() => saveName(name)}
            className="input join-item"
          />
          <button
            type="button"
            className={cn(
              "btn btn-sm border-0 h-7 join-item bg-base-300",
              loop && "bg-base-content text-base-200"
            )}
            onClick={() => saveLoop(!loop)}
            title="Loop Audio"
            aria-label="loop audio"
          >
            <RepeatIcon size={16} />
          </button>
        </div>
        <button
          className="btn btn-phantom btn-square btn-xs"
          onClick={deleteAudioComponent}
          title="Delete Audio"
          aria-label="delete audio"
        >
          <XIcon size={20} />
        </button>
      </div>
    </li>
  );
}

export default EditAudioComponent;
