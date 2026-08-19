import { useContext, useRef, useState, type Context } from "react";
import { useQuery } from "@tanstack/react-query";
import ImageListContainer from "../../components/ListContainer/ImageListContainer";
import { type User } from "firebase/auth";
import { useParams } from "react-router-dom";
import { ImageIcon } from "lucide-react";
import { add } from "./scene/operations/modifiers";
import { defaults } from "./scene/operations/component";
import type { ImageComponent, UploadedFile, Scene } from "./types";
import { handleGeneric } from "../../util/api";
import ModalDialog from "../../components/ModalDialogue";
import useEditorStore from "./stores/editor.ts";
import toast from "react-hot-toast";
import AuthenticationContext from "../../context/AuthenticationContext.jsx";
import SceneContext from "../../context/SceneContext.jsx";
import { getScene, getSceneId } from "./scene/scene";
import { v4 } from "uuid";
import { getImages, uploadImage } from "./imageFiles";

type ModifyScene = (scene: Scene) => Promise<unknown> | undefined;

const ACCEPTED_IMAGE_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
];

async function addImageToScene(
  image: UploadedFile,
  originScene: Scene,
  modifyScene: ModifyScene
) {
  const newImage = structuredClone(defaults.image) as Partial<ImageComponent>;

  const imageId = v4();

  newImage.id = imageId;
  newImage.fileId = image._id;
  newImage.href = image.url;
  newImage.bounds!.verts = await getImageDimensions(image.url);

  // Still on the slide where the operation began:
  // add normally so visual state/history are updated.
  if (getSceneId() === originScene._id) {
    add(newImage);
    return;
  }

  // User moved to another slide while the image was loading.
  // Add it to the original slide instead of the currently active one.
  originScene.components[imageId] = newImage as ImageComponent;

  await modifyScene(originScene);
}

async function addNewImage(
  file: File,
  scenarioId: string,
  user: User,
  originScene: Scene,
  modifyScene: ModifyScene
) {
  const { setLoading } = useEditorStore.getState();
  setLoading(true);

  try {
    const image = await uploadImage(user, scenarioId, file);
    await addImageToScene(image, originScene, modifyScene);
  } catch (e) {
    console.error(e);
    toast.error("Image upload failed");
  } finally {
    setLoading(false);
  }
}

async function getImageDimensions(url: string, defaultHeight = 300) {
  const img = new Image();
  img.src = url;
  await img.decode();
  const scaledWidth = img.naturalWidth * (defaultHeight / img.naturalHeight);
  return [
    { x: 0, y: 0 },
    { x: scaledWidth, y: defaultHeight },
  ];
}

function ImageCreateMenu() {
  const { scenarioId } = useParams<{ scenarioId: string }>();
  const [selectedImage, setSelectedImage] = useState<UploadedFile | null>(null);

  const { user } = useContext(AuthenticationContext as Context<{ user: User }>);
  const { modifyScene } = useContext(
    SceneContext as Context<{
      modifyScene: ModifyScene;
    }>
  );
  const [modalOpen, setModalOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const imagesQuery = useQuery({
    queryFn: () => getImages(user, scenarioId),
    queryKey: ["images", scenarioId],
    enabled: !!scenarioId,
  });

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!ACCEPTED_IMAGE_MIME_TYPES.includes(file.type)) {
      toast.error("Unsupported file type");
      return;
    }

    const originScene = getScene();

    addNewImage(file, scenarioId, user, originScene, modifyScene).catch(
      handleGeneric
    );
  }

  const showFilePicker = () => {
    fileInputRef.current?.click();
  };

  function showModal() {
    setModalOpen(true);
  }
  function handleSubmit() {
    if (!selectedImage) return;

    setModalOpen(false);

    const originScene = getScene();

    addImageToScene(selectedImage, originScene, modifyScene).catch(
      handleGeneric
    );
  }

  return (
    <>
      <div className="dropdown">
        <li className="tooltip tooltip-bottom" data-tip="Add image">
          <a tabIndex={0}>
            <ImageIcon size={16} />
          </a>
        </li>
        <ul
          tabIndex={0}
          className="dropdown-content menu bg-base-300 rounded-box z-1 w-52 p-2 shadow-sm top-[38px]"
        >
          <li
            className="tooltip tooltip-right tooltip-primary"
            data-tip="Upload a new image from your device"
          >
            <a onClick={showFilePicker}>Upload New Image</a>
          </li>
          <li
            className="tooltip tooltip-right tooltip-primary"
            data-tip="Select an existing image from your uploads"
          >
            <a onClick={showModal}>Select Existing Image</a>
          </li>
        </ul>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_IMAGE_MIME_TYPES.join(",")}
        className="hidden"
        onChange={handleFileChange}
      />

      <ModalDialog
        title="Select Image"
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedImage(null);
        }}
      >
        <ImageListContainer
          data={imagesQuery.data}
          selectedId={selectedImage?._id}
          onItemSelected={(img: UploadedFile) => setSelectedImage(img)}
        />
        <div className="modal-action">
          <form method="dialog">
            <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
              ✕
            </button>
          </form>
          <button
            className="btn"
            disabled={!selectedImage}
            onClick={handleSubmit}
          >
            Add
          </button>
        </div>
      </ModalDialog>
    </>
  );
}

export default ImageCreateMenu;
