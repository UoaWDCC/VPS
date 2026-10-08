import { useContext, useRef, useState, type Context } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import ImageListContainer from "../../components/ListContainer/ImageListContainer";
import { type User } from "firebase/auth";
import { useParams } from "react-router-dom";
import { ImageIcon } from "lucide-react";
import type { UploadedFile } from "./types";
import { handleGeneric } from "../../util/api";
import ModalDialog from "../../components/ModalDialogue";
import toast from "react-hot-toast";
import AuthenticationContext from "../../context/AuthenticationContext.jsx";
import SceneContext from "../../context/SceneContext.jsx";
import { getScene } from "./scene/scene";
import {
  ACCEPTED_IMAGE_MIME_TYPES,
  addImageToScene,
  addNewImage,
  getImages,
  type ModifyScene,
} from "./images";

function ImageCreateMenu() {
  const { scenarioId } = useParams<{ scenarioId: string }>();
  const queryClient = useQueryClient();
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

    addNewImage(
      file,
      scenarioId,
      user,
      originScene,
      modifyScene,
      queryClient
    ).catch(handleGeneric);
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
