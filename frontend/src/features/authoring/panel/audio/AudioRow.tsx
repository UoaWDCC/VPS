import { useEffect, useState } from "react";
import { PauseIcon, PlayIcon, RepeatIcon, XIcon } from "lucide-react";
import type { AudioComponent } from "../../types";
import { cn } from "../../../../util/classnames";
import useField from "../../inputs/useField";

interface AudioRowProps {
  component: AudioComponent;
  onDelete: (id: string) => void;
}

function AudioRow({ component, onDelete }: AudioRowProps) {
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

  const nameField = useField("name", { component: component.id });
  const loopField = useField("loop", {
    component: component.id,
    commit: "onChange",
  });

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
            {...nameField.props}
            type="text"
            placeholder="De La Soul"
            className="input join-item"
          />
          <button
            type="button"
            className={cn(
              "btn btn-sm border-0 h-7 join-item bg-base-300",
              loopField.props.value && "bg-base-content text-base-200"
            )}
            onClick={() => loopField.props.onChange(!loopField.props.value)}
            title="Loop Audio"
            aria-label="loop audio"
          >
            <RepeatIcon size={16} />
          </button>
        </div>
        <button
          className="btn btn-phantom btn-square btn-xs"
          onClick={() => onDelete(component.id)}
          title="Delete Audio"
          aria-label="delete audio"
        >
          <XIcon size={20} />
        </button>
      </div>
    </li>
  );
}

export default AudioRow;
