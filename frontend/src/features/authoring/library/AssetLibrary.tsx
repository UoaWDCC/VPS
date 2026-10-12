import {
  useContext,
  useMemo,
  useRef,
  useState,
  type Context,
  type DragEvent,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import type { User } from "firebase/auth";
import toast from "react-hot-toast";
import { SearchIcon, UploadIcon } from "lucide-react";
import AuthenticationContext from "../../../context/AuthenticationContext";
import SceneContext from "../../../context/SceneContext";
import { ACCEPTED_IMAGE_MIME_TYPES, type ModifyScene } from "../images";
import AssetCard from "./AssetCard";
import {
  FILTERS,
  assetToItem,
  filterItems,
  groupItems,
  type Kind,
  type LibraryItem,
  type UploadItem,
} from "./items.js";
import { placeItem } from "./place";
import { PRESET_ITEMS } from "./presets.js";
import {
  failureMessage,
  useAssets,
  useDeleteAsset,
  useUploadAsset,
} from "./useAssets";

const DOCUMENT_MIME_TYPES = ["application/pdf", "text/plain", "text/markdown"];
const ACCEPT = [
  ...ACCEPTED_IMAGE_MIME_TYPES,
  "audio/*",
  ...DOCUMENT_MIME_TYPES,
].join(",");

// A first check, so an obviously wrong file doesn't wait for an upload to be
// told so. The server has the final say on what's allowed.
function isSupported(file: File) {
  return (
    ACCEPTED_IMAGE_MIME_TYPES.includes(file.type) ||
    file.type.startsWith("audio/") ||
    DOCUMENT_MIME_TYPES.includes(file.type)
  );
}

function carriesFiles(event: DragEvent) {
  return Array.from(event.dataTransfer.types).includes("Files");
}

/**
 * The editor's asset library: ready-made buttons, icons and sounds, plus the
 * author's own uploads, which are theirs to use in any scenario. Search finds
 * things by name or tag, and clicking one puts it in the scene.
 * @component
 */
export default function AssetLibrary() {
  const { scenarioId } = useParams<{ scenarioId: string }>();
  const { user } = useContext(AuthenticationContext as Context<{ user: User }>);
  const { modifyScene } = useContext(
    SceneContext as Context<{ modifyScene: ModifyScene }>
  );
  const queryClient = useQueryClient();

  const assets = useAssets();
  const upload = useUploadAsset();
  const remove = useDeleteAsset();

  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<"all" | Kind>("all");
  const [pending, setPending] = useState<File | null>(null);
  const [tags, setTags] = useState("");
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const items = useMemo<LibraryItem[]>(
    () => [...(assets.data ?? []).map(assetToItem), ...PRESET_ITEMS],
    [assets.data]
  );
  const visible = filterItems(items, { query, kind });
  const sections = groupItems(visible);
  const searching = query.trim() !== "" || kind !== "all";
  const hasUploads = (assets.data ?? []).length > 0;
  // the uploads section can be empty only because nothing's uploaded yet
  const showUploadHint = !hasUploads && !searching && !assets.isError;

  function chooseFile(file: File | undefined) {
    if (!file) return;
    if (!isSupported(file)) {
      toast.error("That file type isn't supported");
      return;
    }
    setPending(file);
    setTags("");
  }

  function cancelUpload() {
    setPending(null);
    setTags("");
  }

  async function submitUpload() {
    if (!pending || upload.isLoading) return;
    try {
      await upload.mutateAsync({ file: pending, tags });
      toast.success(`Added "${pending.name}" to your library`);
      cancelUpload();
    } catch (e) {
      toast.error(failureMessage(e, "Upload failed"));
    }
  }

  async function use(item: LibraryItem) {
    setBusyKey(item.key);
    try {
      await placeItem(item, { user, scenarioId, modifyScene, queryClient });
    } catch (e) {
      console.error(e);
      toast.error(failureMessage(e, `Couldn't add "${item.name}"`));
    } finally {
      setBusyKey(null);
    }
  }

  async function removeUpload(item: UploadItem) {
    const sure = window.confirm(
      `Remove "${item.name}" from your library? Scenes that already use it keep it.`
    );
    if (!sure) return;
    try {
      await remove.mutateAsync(item.asset._id);
    } catch (e) {
      toast.error(failureMessage(e, `Couldn't remove "${item.name}"`));
    }
  }

  function handleDragOver(event: DragEvent) {
    if (!carriesFiles(event)) return;
    event.preventDefault();
    setDragging(true);
  }

  function handleDragLeave(event: DragEvent) {
    if (event.currentTarget.contains(event.relatedTarget as Node | null))
      return;
    setDragging(false);
  }

  function handleDrop(event: DragEvent) {
    if (!carriesFiles(event)) return;
    event.preventDefault();
    setDragging(false);
    chooseFile(event.dataTransfer.files[0]);
  }

  return (
    <div
      className={`relative flex flex-col gap-3 rounded-sm ${
        dragging ? "outline-2 outline-dashed outline-accent" : ""
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex gap-2">
        <label className="input input-sm search min-w-0 flex-1">
          <input
            type="search"
            placeholder="Search names and tags"
            aria-label="Search the library"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <SearchIcon size={14} />
        </label>
        <button
          type="button"
          className="btn btn-sm"
          onClick={() => fileInputRef.current?.click()}
        >
          <UploadIcon size={14} />
          Upload
        </button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={ACCEPT}
          onChange={(e) => {
            chooseFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </div>

      <div className="flex flex-wrap gap-1" role="group" aria-label="Show">
        {FILTERS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            className={`btn btn-xs ${kind === id ? "btn-active" : ""}`}
            aria-pressed={kind === id}
            onClick={() => setKind(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {pending && (
        <form
          className="flex flex-col gap-2 rounded-sm bg-base-300 p-3"
          onSubmit={(e) => {
            e.preventDefault();
            void submitUpload();
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") cancelUpload();
          }}
        >
          <p className="truncate text-xs font-semibold" title={pending.name}>
            {pending.name}
          </p>
          <input
            type="text"
            className="input input-xs w-full"
            placeholder="Tags, separated by commas (optional)"
            aria-label="Tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            // the point of picking a file is to tag it
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="btn btn-ghost btn-xs"
              onClick={cancelUpload}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-accent btn-xs"
              disabled={upload.isLoading}
            >
              {upload.isLoading ? "Uploading…" : "Add to library"}
            </button>
          </div>
        </form>
      )}

      {assets.isError && (
        <div className="flex items-center justify-between gap-2 rounded-sm bg-base-300 p-3 text-xs">
          <span>Couldn&apos;t load your uploads.</span>
          <button
            type="button"
            className="btn btn-xs"
            onClick={() => void assets.refetch()}
          >
            Try again
          </button>
        </div>
      )}

      {showUploadHint && (
        <div className="rounded-sm border border-dashed border-base-content/30 p-4 text-center text-xs text-base-content/70">
          <p className="font-semibold">Your uploads will appear here</p>
          <p className="mt-1">
            Drop a file here, or press Upload. Anything you add can be used in
            every scenario.
          </p>
        </div>
      )}

      {sections.map((section) => (
        <section key={section.id} aria-label={section.title}>
          <h3 className="mb-2 text-xs font-semibold text-base-content/70">
            {section.title}
          </h3>
          <ul className="grid grid-cols-2 gap-2">
            {section.items.map((item) => (
              <AssetCard
                key={item.key}
                item={item}
                busy={busyKey === item.key}
                onUse={(chosen) => void use(chosen)}
                onDelete={(chosen) => void removeUpload(chosen)}
              />
            ))}
          </ul>
        </section>
      ))}

      {sections.length === 0 && (
        <p className="py-6 text-center text-xs text-base-content/70">
          Nothing matches{query.trim() ? ` “${query.trim()}”` : " that"}.
        </p>
      )}

      {dragging && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-sm bg-base-200/80 text-sm font-semibold">
          Drop to upload
        </div>
      )}
    </div>
  );
}
