import {
  useContext,
  useRef,
  useState,
  type Context,
  type DragEvent,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import type { User } from "firebase/auth";
import toast from "react-hot-toast";
import AuthenticationContext from "../../context/AuthenticationContext.jsx";
import SceneContext from "../../context/SceneContext.jsx";
import { handleGeneric } from "../../util/api";
import { getScene } from "./scene/scene";
import {
  ACCEPTED_IMAGE_MIME_TYPES,
  addNewImage,
  type ModifyScene,
} from "./images";
import type { Vec2 } from "./types";

// Each additional image in a multi-file drop is offset by this much, so a
// stack of same-sized images does not hide all but the last one.
const CASCADE_STEP = 24;

// A single drop is capped so a stray folder drag cannot queue hundreds of
// uploads. Also roughly where the cascade stops fitting on the canvas.
const MAX_DROP_FILES = 20;

// How many rejected filenames are listed before the message is summarised.
const MAX_NAMED_FILES = 5;

// Names the rejected files, capped so a large drop cannot fill the screen.
function listNames(files: File[]) {
  const names = files.slice(0, MAX_NAMED_FILES).map((file) => file.name);
  const remaining = files.length - names.length;
  if (remaining > 0) names.push(`and ${remaining} more`);
  return names.join(", ");
}

function hasFiles(event: DragEvent) {
  return Array.from(event.dataTransfer.types).includes("Files");
}

/**
 * Uploads image files dropped onto the canvas and adds them to the current
 * scene, centred on the point they were dropped at.
 *
 * @param toSVGSpace converts client coordinates to canvas coordinates
 */
export default function useImageDrop(
  toSVGSpace: (clientX: number, clientY: number) => Vec2
) {
  const { scenarioId } = useParams<{ scenarioId: string }>();
  const queryClient = useQueryClient();

  const { user } = useContext(AuthenticationContext as Context<{ user: User }>);
  const { modifyScene } = useContext(
    SceneContext as Context<{ modifyScene: ModifyScene }>
  );

  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // dragenter/dragleave also fire when the pointer crosses into a child
  // element, so the nesting depth is tracked rather than a plain boolean.
  const depth = useRef(0);

  function handleDragEnter(event: DragEvent) {
    if (!hasFiles(event)) return;
    event.preventDefault();
    depth.current++;
    setIsDraggingOver(true);
  }

  function handleDragOver(event: DragEvent) {
    if (!hasFiles(event)) return;
    // without this the browser navigates to the dropped file
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }

  function handleDragLeave(event: DragEvent) {
    if (!hasFiles(event)) return;
    depth.current = Math.max(0, depth.current - 1);
    if (depth.current === 0) setIsDraggingOver(false);
  }

  function handleDrop(event: DragEvent) {
    if (!hasFiles(event)) return;
    event.preventDefault();

    depth.current = 0;
    setIsDraggingOver(false);

    const files = Array.from(event.dataTransfer.files);
    if (files.length === 0) return;

    const images: File[] = [];
    const rejected: File[] = [];

    files.forEach((file) =>
      (ACCEPTED_IMAGE_MIME_TYPES.includes(file.type) ? images : rejected).push(
        file
      )
    );

    if (rejected.length > 0) {
      toast.error(
        `Unsupported file type: ${listNames(rejected)}`,
        // a long list of names needs longer than the default to read
        { duration: 6000 }
      );
    }

    if (images.length === 0) return;

    let accepted = images;
    if (images.length > MAX_DROP_FILES) {
      accepted = images.slice(0, MAX_DROP_FILES);
      toast.error(
        `Only the first ${MAX_DROP_FILES} images were added. ` +
          `${images.length - MAX_DROP_FILES} were skipped.`,
        { duration: 6000 }
      );
    }

    const origin = toSVGSpace(event.clientX, event.clientY);
    const originScene = getScene();

    accepted.forEach((file, index) => {
      const center = {
        x: origin.x + index * CASCADE_STEP,
        y: origin.y + index * CASCADE_STEP,
      };

      addNewImage(
        file,
        scenarioId,
        user,
        originScene,
        modifyScene,
        queryClient,
        center
      ).catch(handleGeneric);
    });
  }

  return {
    isDraggingOver,
    dropHandlers: {
      onDragEnter: handleDragEnter,
      onDragOver: handleDragOver,
      onDragLeave: handleDragLeave,
      onDrop: handleDrop,
    },
  };
}
