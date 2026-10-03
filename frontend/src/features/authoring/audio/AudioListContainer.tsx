import { useEffect, useRef, useState } from "react";
import type { UploadedFile } from "../types";
import { PauseIcon, PlayIcon } from "lucide-react";
import { cn } from "../../../util/classnames";

/**
 * Component used to display audio in a list format.
 */
function AudioListContainer({
  data,
  onItemSelected,
  selectedId,
}: {
  data?: UploadedFile[];
  onItemSelected: (audio: UploadedFile) => void;
  selectedId?: string;
}) {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});

  function getAudio(item: UploadedFile) {
    if (!audioRefs.current[item._id]) {
      const audio = new Audio(item.url);
      audio.addEventListener("ended", () => setPlayingId(null));
      audioRefs.current[item._id] = audio;
    }
    return audioRefs.current[item._id];
  }

  function togglePlayback(e: React.MouseEvent, item: UploadedFile) {
    e.stopPropagation();
    const audio = getAudio(item);
    if (playingId === item._id) {
      audio.pause();
      setPlayingId(null);
    } else {
      if (playingId) audioRefs.current[playingId]?.pause();
      void audio.play();
      setPlayingId(item._id);
    }
  }

  useEffect(() => {
    return () => Object.values(audioRefs.current).forEach((a) => a.pause());
  }, []);

  return (
    <div className="grid grid-cols-2 gap-2">
      {data?.map((item) => (
        <div
          key={item._id}
          className={cn(
            "flex items-center bg-base-300 rounded-sm",
            item._id === selectedId && "outline-accent outline-2"
          )}
        >
          <button
            type="button"
            className="btn btn-xs btn-phantom btn-square pl-1"
            onClick={(e) => togglePlayback(e, item)}
            title="Toggle Audio Playback"
            aria-label="toggle audio playback"
          >
            {playingId === item._id ? (
              <PauseIcon size={20} />
            ) : (
              <PlayIcon size={20} />
            )}
          </button>
          <button
            type="button"
            onClick={() => onItemSelected(item)}
            className="truncate w-full text-left text-xs px-2 py-2"
          >
            {item.name}
          </button>
        </div>
      ))}
    </div>
  );
}

export default AudioListContainer;
