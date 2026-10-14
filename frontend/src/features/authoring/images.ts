import type { User } from "firebase/auth";
import type { AxiosResponse } from "axios";
import type { QueryClient } from "@tanstack/react-query";
import { v4 } from "uuid";
import toast from "react-hot-toast";
import { api } from "../../util/api";
import type {
  Bounds,
  ImageComponent,
  Scene,
  UploadedFile,
  Vec2,
} from "./types";
import { add } from "./scene/operations/modifiers";
import { defaults, getNextZIndex } from "./scene/operations/component";
import { getSceneId } from "./scene/scene";
import useEditorStore from "./stores/editor";
import { CANVAS_HEIGHT, CANVAS_WIDTH } from "../../util/canvas";

export async function getImages(user: User, scenarioId: string) {
  const response = (await api.get(
    user,
    `api/files/${scenarioId}/type/image`
  )) as AxiosResponse<UploadedFile[]>;
  return response.data;
}

export async function uploadImage(
  user: User,
  scenarioId: string,
  file: File,
  onProgress?: (fraction: number) => void
) {
  const formData = new FormData();
  formData.append("file", file);

  const response = (await api.post(user, `api/files/${scenarioId}`, formData, {
    // axios 0.21 hands back a native ProgressEvent
    onUploadProgress: (event: ProgressEvent) => {
      if (!onProgress || !event.lengthComputable || !event.total) return;
      onProgress(event.loaded / event.total);
    },
  })) as AxiosResponse<UploadedFile>;
  return response.data;
}

export const ACCEPTED_IMAGE_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
];

// Time the placeholder is held over the finished image so its blur and label
// can finish resolving, rather than the two swapping in a single frame.
const HANDOFF_MS = 250;

export type ModifyScene = (scene: Scene) => Promise<unknown> | undefined;

export async function addImageToScene(
  image: UploadedFile,
  originScene: Scene,
  modifyScene: ModifyScene,
  verts?: Vec2[]
) {
  const newImage = structuredClone(defaults.image) as Partial<ImageComponent>;

  const imageId = v4();

  newImage.id = imageId;
  newImage.fileId = image._id;
  newImage.href = image.url;
  newImage.bounds!.verts = verts ?? (await getImageVerts(image.url));

  // Still on the slide where the operation began:
  // add normally so visual state/history are updated.
  if (getSceneId() === originScene._id) {
    // Images bypass createComponentFromBounds, so the top-of-stack zIndex that
    // every other component type gets on creation has to be assigned here.
    newImage.zIndex = getNextZIndex();
    add(newImage);
    return;
  }

  // User moved to another slide while the image was loading.
  // Add it to the original slide instead of the currently active one.
  newImage.zIndex = getNextZIndex(originScene.components);
  originScene.components[imageId] = newImage as ImageComponent;

  await modifyScene(originScene);
}

export async function addNewImage(
  file: File,
  scenarioId: string,
  user: User,
  originScene: Scene,
  modifyScene: ModifyScene,
  queryClient: QueryClient,
  // where the image should be centred; defaults to the middle of the canvas
  center?: Vec2
) {
  const { addPendingImage, updatePendingImage, removePendingImage } =
    useEditorStore.getState();

  // Measure and preview the local file so a placeholder of the right size can
  // be shown on the canvas for the duration of the upload.
  const previewUrl = URL.createObjectURL(file);
  const placeholderId = v4();

  try {
    const verts = await getImageVerts(previewUrl, center);
    const bounds: Bounds = { verts, rotation: 0 };

    addPendingImage({
      id: placeholderId,
      sceneId: originScene._id,
      bounds,
      previewUrl,
      progress: 0,
      settled: false,
    });

    const image = await uploadImage(user, scenarioId, file, (fraction) =>
      // Hold the last tenth back: the bytes are sent, but the server still has
      // to store the file and answer.
      updatePendingImage(placeholderId, { progress: fraction * 0.9 })
    );

    await queryClient.invalidateQueries({
      queryKey: ["images", scenarioId],
    });

    // Decode the uploaded file before handing over, so the placeholder is
    // never replaced by an empty frame while the browser fetches it.
    await preload(image.url);
    updatePendingImage(placeholderId, { progress: 1, settled: true });

    await addImageToScene(image, originScene, modifyScene, verts);

    // The placeholder now sits over the real image, unblurred and showing the
    // same picture, so removing it is invisible.
    await wait(HANDOFF_MS);
  } catch (e) {
    console.error(e);
    toast.error("Image upload failed");
  } finally {
    removePendingImage(placeholderId);
    URL.revokeObjectURL(previewUrl);
  }
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function preload(url: string) {
  const img = new Image();
  img.src = url;
  // a failure here is not fatal — the <image> element will load it anyway
  await img.decode().catch(() => {});
}

function clamp(value: number, min: number, max: number) {
  // max can fall below min for an image exactly as large as the canvas
  return Math.max(min, Math.min(max, value));
}

// Placed at its true pixel size, centred on `center` (or on the canvas when no
// centre is given). Anything larger than the canvas is scaled down to fit, and
// the result is nudged back inside the slide so it stays wholly visible.
export async function getImageVerts(url: string, center?: Vec2) {
  const img = new Image();
  img.src = url;
  await img.decode();

  const scale = Math.min(
    1,
    CANVAS_WIDTH / img.naturalWidth,
    CANVAS_HEIGHT / img.naturalHeight
  );
  const width = img.naturalWidth * scale;
  const height = img.naturalHeight * scale;

  const x = clamp(
    center ? center.x - width / 2 : (CANVAS_WIDTH - width) / 2,
    0,
    CANVAS_WIDTH - width
  );
  const y = clamp(
    center ? center.y - height / 2 : (CANVAS_HEIGHT - height) / 2,
    0,
    CANVAS_HEIGHT - height
  );

  return [
    { x, y },
    { x: x + width, y: y + height },
  ];
}
