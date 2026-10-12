import { SparklesIcon } from "lucide-react";
import useEditorStore from "../stores/editor";
import { stop } from "./controller";

/** Shown over the scene while the assistant is changing it. */
export default function EditingBanner() {
  const locked = useEditorStore((state) => state.locked);
  if (!locked) return null;

  return (
    <div
      role="status"
      title="You can edit again when it's done."
      // over the scene, clear of the side panel
      className="absolute left-[12.5rem] top-2 z-40 flex items-center gap-3 rounded-sm bg-base-300 px-3 py-1.5 text-sm shadow-md"
    >
      <SparklesIcon size={15} className="animate-pulse" />
      <span>The assistant is editing</span>
      <button type="button" className="btn btn-error btn-xs" onClick={stop}>
        Stop
      </button>
    </div>
  );
}
