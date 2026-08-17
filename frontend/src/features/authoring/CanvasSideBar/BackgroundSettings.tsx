import {
  useContext,
  useRef,
  useState,
  type Context,
  type ChangeEvent,
} from "react";
import { ImageIcon, Trash2Icon, UploadIcon } from "lucide-react";
import { useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { User } from "firebase/auth";
import toast from "react-hot-toast";
import AuthenticationContext from "../../../context/AuthenticationContext";
import ImageListContainer from "../../../components/ListContainer/ImageListContainer";
import ModalDialog from "../../../components/ModalDialogue";
import useVisualScene from "../stores/visual";
import useEditorStore from "../stores/editor";
import { modifySceneProp } from "../scene/operations/modifiers";
import { getImages, uploadImage } from "../imageFiles";
import type { BackgroundFit, SceneBackground, UploadedFile } from "../types";

const fitOptions: { value: BackgroundFit; label: string }[] = [
  { value: "cover", label: "Cover (crop to fit)" },
  { value: "contain", label: "Contain (show whole image)" },
  { value: "fill", label: "Fill (stretch to fit)" },
];

function toBackground(
  image: UploadedFile,
  fit: BackgroundFit
): SceneBackground {
  return {
    fileId: image._id,
    href: image.url,
    fit,
  };
}

function BackgroundSettings() {
  const background = useVisualScene((state) => state.background);
  const { user } = useContext(AuthenticationContext as Context<{ user: User }>);
  const { scenarioId } = useParams<{ scenarioId: string }>();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<UploadedFile | null>(null);

  const imagesQuery = useQuery({
    queryFn: () => getImages(user, scenarioId),
    queryKey: ["images", scenarioId],
    enabled: !!scenarioId,
  });

  function setBackground(image: UploadedFile) {
    modifySceneProp(
      "background",
      toBackground(image, background?.fit ?? "cover")
    );
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file?.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }

    useEditorStore.getState().setLoading(true);
    try {
      const image = await uploadImage(user, scenarioId, file);
      setBackground(image);
      await queryClient.invalidateQueries({
        queryKey: ["images", scenarioId],
      });
    } catch (error) {
      console.error(error);
      toast.error("Background upload failed");
    } finally {
      useEditorStore.getState().setLoading(false);
    }
  }

  function openImagePicker() {
    const current = imagesQuery.data?.find(
      (image) => image._id === background?.fileId
    );
    setSelectedImage(current ?? null);
    setModalOpen(true);
  }

  function closeImagePicker() {
    setModalOpen(false);
    setSelectedImage(null);
  }

  function applySelectedImage() {
    if (!selectedImage) return;
    setBackground(selectedImage);
    closeImagePicker();
  }

  function changeFit(fit: BackgroundFit) {
    if (!background) return;
    modifySceneProp("background", { ...background, fit });
  }

  return (
    <>
      <div className="collapse overflow-visible collapse-arrow bg-base-300 rounded-sm text-s">
        <input type="checkbox" />
        <div className="collapse-title">Background</div>
        <div className="collapse-content text--1 bg-base-200">
          <div className="flex flex-col gap-3 pt-2">
            {background ? (
              <img
                src={background.href}
                alt="Current scene background"
                className="w-full aspect-video rounded-sm bg-base-300"
                style={{ objectFit: background.fit }}
              />
            ) : (
              <div className="w-full aspect-video rounded-sm bg-base-300 flex items-center justify-center text-center px-4 opacity-70">
                No background set
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                className="btn btn-sm flex-1"
                onClick={openImagePicker}
              >
                <ImageIcon size={15} />
                Choose
              </button>
              <button
                type="button"
                className="btn btn-sm flex-1"
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadIcon size={15} />
                Upload
              </button>
              {background && (
                <button
                  type="button"
                  className="btn btn-sm btn-square"
                  aria-label="Remove background"
                  title="Remove background"
                  onClick={() => modifySceneProp("background", null)}
                >
                  <Trash2Icon size={15} />
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*"
              onChange={(event) => void handleFileChange(event)}
            />

            <fieldset className="fieldset">
              <label className="label" htmlFor="background-fit">
                Image fit
              </label>
              <select
                id="background-fit"
                className="select w-full"
                value={background?.fit ?? "cover"}
                disabled={!background}
                onChange={(event) =>
                  changeFit(event.target.value as BackgroundFit)
                }
              >
                {fitOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </fieldset>
          </div>
        </div>
      </div>

      <ModalDialog
        title="Select Background"
        open={modalOpen}
        onClose={closeImagePicker}
      >
        {imagesQuery.isLoading ? (
          <p>Loading images...</p>
        ) : imagesQuery.data?.length ? (
          <ImageListContainer
            data={imagesQuery.data}
            selectedId={selectedImage?._id}
            onItemSelected={(image: UploadedFile) => setSelectedImage(image)}
          />
        ) : (
          <p>No uploaded images yet. Upload one from the background panel.</p>
        )}
        <div className="modal-action">
          <button
            type="button"
            className="btn"
            disabled={!selectedImage}
            onClick={applySelectedImage}
          >
            Set background
          </button>
        </div>
      </ModalDialog>
    </>
  );
}

export default BackgroundSettings;
