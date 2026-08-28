import {
  useContext,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type Context,
  type Dispatch,
  type SetStateAction,
} from "react";
import { UploadIcon } from "lucide-react";
import { useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { User } from "firebase/auth";
import toast from "react-hot-toast";
import AuthenticationContext from "../../../context/AuthenticationContext";
import ImageListContainer from "../../../components/ListContainer/ImageListContainer";
import ModalDialog from "../../../components/ModalDialogue";
import Thumbnail from "../components/Thumbnail";
import useVisualScene from "../stores/visual";
import useEditorStore from "../stores/editor";
import { getScene } from "../scene/scene";
import { modifySceneProp } from "../scene/operations/modifiers";
import { getImages, uploadImage } from "../images";
import type {
  BackgroundFit,
  ImageBackground,
  SceneBackground,
  UploadedFile,
} from "../types";

const fitOptions: { value: BackgroundFit; label: string }[] = [
  { value: "cover", label: "Cover (crop to fit)" },
  { value: "contain", label: "Contain (show whole image)" },
  { value: "fill", label: "Fill (stretch to fit)" },
];

type BackgroundSource = "color" | "image";

function toImageBackground(
  image: UploadedFile,
  fit: BackgroundFit
): ImageBackground {
  return {
    kind: "image",
    fileId: image._id,
    href: image.url,
    fit,
  };
}

function BackgroundMenu({
  show,
  setShow,
}: {
  show: boolean;
  setShow: Dispatch<SetStateAction<boolean>>;
}) {
  const background = useVisualScene((state) => state.background);
  const visualComponents = useVisualScene((state) => state.components);
  const { user } = useContext(AuthenticationContext as Context<{ user: User }>);
  const { scenarioId } = useParams<{ scenarioId: string }>();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [source, setSource] = useState<BackgroundSource>("color");
  const [color, setColor] = useState("#ffffff");
  const [fit, setFit] = useState<BackgroundFit>("cover");
  const [selectedImage, setSelectedImage] = useState<UploadedFile | null>(null);

  const imagesQuery = useQuery({
    queryFn: () => getImages(user, scenarioId),
    queryKey: ["images", scenarioId],
    enabled: !!scenarioId && show,
  });

  useEffect(() => {
    if (!show) return;

    setSelectedImage(null);
    if (!background) {
      setSource("color");
      setColor("#ffffff");
      setFit("cover");
    } else if (background.kind === "color") {
      setSource("color");
      setColor(background.color.slice(0, 7));
    } else {
      setSource("image");
      setFit(background.fit ?? "cover");
    }
  }, [show, background]);

  useEffect(() => {
    if (!show || selectedImage || !background || background.kind === "color") {
      return;
    }

    const current = imagesQuery.data?.find(
      (image) => image._id === background.fileId
    );
    if (current) setSelectedImage(current);
  }, [show, background, imagesQuery.data, selectedImage]);

  const existingImage =
    background && background.kind !== "color" ? { ...background, fit } : null;
  const previewBackground: SceneBackground | null =
    source === "color"
      ? { kind: "color", color }
      : selectedImage
        ? toImageBackground(selectedImage, fit)
        : existingImage;

  const sceneComponents = Object.keys(visualComponents)
    .map((id) => getScene().components[id])
    .filter(Boolean);

  function close() {
    setShow(false);
  }

  function applyBackground() {
    if (!previewBackground) return;
    modifySceneProp("background", previewBackground);
    close();
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
      setSelectedImage(image);
      setSource("image");
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

  function removeBackground() {
    modifySceneProp("background", null);
    close();
  }

  return (
    <ModalDialog wide title="Background" open={show} onClose={close}>
      <div className="grid grid-cols-[minmax(20rem,1fr)_minmax(22rem,1.25fr)] gap-6 items-start">
        <div className="flex min-h-0 flex-col gap-4">
          <fieldset
            className={`rounded-sm border p-4 ${
              source === "color" ? "border-accent" : "border-base-300"
            }`}
          >
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="radio"
                name="background-source"
                className="radio radio-sm"
                checked={source === "color"}
                onChange={() => setSource("color")}
              />
              <span className="font-medium">Solid colour</span>
            </label>
            <div className="mt-3 flex items-center gap-3 pl-7">
              <input
                id="background-color"
                type="color"
                className="size-11 cursor-pointer rounded-sm bg-transparent"
                value={color}
                onFocus={() => setSource("color")}
                onChange={(event) => {
                  setColor(event.target.value);
                  setSource("color");
                }}
              />
              <label htmlFor="background-color" className="font-mono uppercase">
                {color}
              </label>
            </div>
          </fieldset>

          <fieldset
            className={`flex min-h-0 flex-col rounded-sm border p-4 ${
              source === "image" ? "border-accent" : "border-base-300"
            }`}
          >
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="radio"
                name="background-source"
                className="radio radio-sm"
                checked={source === "image"}
                onChange={() => setSource("image")}
              />
              <span className="font-medium">Image</span>
            </label>

            <div className="mt-3 flex items-end gap-3 pl-7">
              <fieldset className="fieldset flex-1">
                <label className="label" htmlFor="background-fit">
                  Image fit
                </label>
                <select
                  id="background-fit"
                  className="select w-full"
                  value={fit}
                  onChange={(event) => {
                    setFit(event.target.value as BackgroundFit);
                    setSource("image");
                  }}
                >
                  {fitOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </fieldset>
              <button
                type="button"
                className="btn"
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadIcon size={16} />
                Upload
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*"
              onChange={(event) => void handleFileChange(event)}
            />

            <div className="mt-4 min-h-0 pl-7">
              <p className="label mb-2">Uploaded images</p>
              {imagesQuery.isLoading ? (
                <p>Loading images...</p>
              ) : imagesQuery.data?.length ? (
                <div className="max-h-[28vh] overflow-y-auto pr-1">
                  <ImageListContainer
                    data={imagesQuery.data}
                    selectedId={selectedImage?._id}
                    onItemSelected={(image: UploadedFile) => {
                      setSelectedImage(image);
                      setSource("image");
                    }}
                  />
                </div>
              ) : (
                <div className="rounded-sm bg-base-200 p-5 text-center">
                  No uploaded images yet.
                </div>
              )}
            </div>
          </fieldset>

          <div className="flex items-center justify-between gap-3">
            {background ? (
              <button
                type="button"
                className="btn btn-ghost text-error"
                onClick={removeBackground}
              >
                Remove background
              </button>
            ) : (
              <span />
            )}
            <button
              type="button"
              className="btn btn-primary"
              disabled={!previewBackground}
              onClick={applyBackground}
            >
              Apply background
            </button>
          </div>
        </div>

        <div className="sticky top-0">
          <p className="label mb-2">Current scene preview</p>
          <div className="aspect-video w-full overflow-hidden rounded-sm border border-base-300 bg-base-200">
            <Thumbnail
              components={sceneComponents}
              background={previewBackground}
              className="block h-full w-full"
            />
          </div>
          {source === "image" && !previewBackground && (
            <p className="mt-2 text-xs opacity-70">
              Select or upload an image to preview it.
            </p>
          )}
        </div>
      </div>
    </ModalDialog>
  );
}

export default BackgroundMenu;
