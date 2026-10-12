import { useEffect, useRef, useState } from "react";
import { FileTextIcon, PauseIcon, PlayIcon, Trash2Icon } from "lucide-react";
import type { LibraryItem, UploadItem } from "./items.js";

// Cards sit on the panel's own surface, and anything that will appear on the
// canvas is previewed on white, because that's what the canvas is.

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function subtitle(item: LibraryItem) {
  // a tag that only repeats what the card already is says nothing
  const tags = item.tags.filter((tag) => tag !== item.kind);
  if (tags.length)
    return tags
      .slice(0, 2)
      .map((tag) => `#${tag}`)
      .join(" ");
  return item.source === "upload" ? formatSize(item.size) : "";
}

function ButtonPreview({
  item,
}: {
  item: Extract<LibraryItem, { kind: "button" }>;
}) {
  return (
    <div
      className={`flex h-9 w-[88%] items-center justify-center px-2 text-xs font-bold ${
        item.shape === "ellipse" ? "rounded-full" : ""
      }`}
      style={{
        background: item.fill,
        color: item.textColor,
        border: item.strokeWidth > 0 ? `2px solid ${item.stroke}` : undefined,
      }}
    >
      <span className="truncate">{item.label}</span>
    </div>
  );
}

/** Plays and pauses a sound without leaving the library. */
function PlayButton({ url, name }: { url: string; name: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    return () => audioRef.current?.pause();
  }, []);

  function toggle() {
    if (!audioRef.current) {
      audioRef.current = new Audio(url);
      audioRef.current.addEventListener("ended", () => setPlaying(false));
    }
    const audio = audioRef.current;
    if (playing) {
      audio.pause();
      audio.currentTime = 0;
      setPlaying(false);
    } else {
      void audio.play().catch(() => setPlaying(false));
      setPlaying(true);
    }
  }

  return (
    <button
      type="button"
      className="btn btn-circle btn-sm relative z-10"
      onClick={toggle}
      aria-label={`${playing ? "Stop" : "Play"} ${name}`}
    >
      {playing ? <PauseIcon size={14} /> : <PlayIcon size={14} />}
    </button>
  );
}

function Preview({ item }: { item: LibraryItem }) {
  const frame = "flex aspect-[4/3] items-center justify-center rounded-sm";
  switch (item.kind) {
    case "button":
      return (
        <div className={`${frame} bg-white`}>
          <ButtonPreview item={item} />
        </div>
      );
    case "image":
      return (
        <div className={`${frame} overflow-hidden bg-white p-1.5`}>
          <img
            src={item.url}
            alt=""
            loading="lazy"
            draggable={false}
            className="max-h-full max-w-full object-contain"
          />
        </div>
      );
    case "audio":
      return (
        <div className={`${frame} bg-base-100`}>
          <PlayButton url={item.url} name={item.name} />
        </div>
      );
    case "document":
      return (
        <div
          className={`${frame} flex-col gap-1 bg-base-100 text-base-content/60`}
        >
          <FileTextIcon size={28} />
          <span className="text-[11px] uppercase">
            {item.name.split(".").pop()?.slice(0, 5)}
          </span>
        </div>
      );
  }
}

/**
 * One thing in the library. Clicking it adds it to the scene; an upload can
 * also be removed from the library.
 *
 * The click target is a button stretched over the whole card, with the play
 * and remove controls above it, so no button sits inside another.
 * @component
 */
export default function AssetCard({
  item,
  busy,
  onUse,
  onDelete,
}: {
  item: LibraryItem;
  busy: boolean;
  onUse: (item: LibraryItem) => void;
  onDelete?: (item: UploadItem) => void;
}) {
  const title = item.tags.length
    ? `${item.name} (${item.tags.join(", ")})`
    : item.name;

  return (
    <li
      className="group relative flex flex-col gap-1.5 rounded-sm bg-base-300 p-2 transition-colors hover:bg-base-100"
      aria-busy={busy}
    >
      <Preview item={item} />
      <span className="truncate text-xs font-medium">{item.name}</span>
      <span className="h-4 truncate text-[11px] text-base-content/60">
        {subtitle(item)}
      </span>

      <button
        type="button"
        className="absolute inset-0 rounded-sm focus-visible:outline-2 focus-visible:outline-accent"
        onClick={() => onUse(item)}
        disabled={busy}
        title={title}
        aria-label={`Add ${item.name}`}
      />

      {item.source === "upload" && onDelete && (
        <button
          type="button"
          className="btn btn-ghost btn-xs btn-square absolute right-1 top-1 z-10 bg-base-300/80 opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
          onClick={() => onDelete(item)}
          aria-label={`Remove ${item.name} from your library`}
          title="Remove from library"
        >
          <Trash2Icon size={12} />
        </button>
      )}

      {busy && (
        <span className="loading loading-spinner loading-sm pointer-events-none absolute inset-0 m-auto text-base-content/70" />
      )}
    </li>
  );
}
