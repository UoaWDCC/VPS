import { useEffect, useRef, useState } from "react";
import type { UploadedFile } from "../types";

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
    return () => {
      Object.values(audioRefs.current).forEach((a) => a.pause());
    };
  }, []);

  return (
    <div className="grid grid-cols-2 gap-2">
      {data?.map((item) => (
        <button
          type="button"
          key={item._id}
          onClick={() => onItemSelected(item)}
          className={
            "flex items-center justify-between px-2 py-1 bg-base-300 " +
            (item._id === selectedId ? "outline-accent outline-2" : "")
          }
        >
          <span className="truncate text-xs">{item.name}</span>
          <button
            type="button"
            className="btn btn-xs btn-phantom"
            onClick={(e) => togglePlayback(e, item)}
          >
            {playingId === item._id ? "Pause" : "Play"}
          </button>
        </button>
      ))}
    </div>
  );
}

export default AudioListContainer;
