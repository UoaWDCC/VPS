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
import { ImageIcon, PaletteIcon, UploadIcon } from "lucide-react";
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
import type { BackgroundFit, ImageBackground, UploadedFile } from "../types";

const fitOptions: { value: BackgroundFit; label: string }[] = [
  { value: "cover", label: "Cover (crop to fit)" },
  { value: "contain", label: "Contain (show whole image)" },
  { value: "fill", label: "Fill (stretch to fit)" },
];

type BackgroundMode = "color" | "image";

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
  const { user } = useContext(AuthenticationContext as Context<{ user: User }>);
  const { scenarioId } = useParams<{ scenarioId: string }>();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [mode, setMode] = useState<BackgroundMode>("color");
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

    if (!background) {
      setMode("color");
      setColor("#ffffff");
      setFit("cover");
      setSelectedImage(null);
      return;
    }

    if (background?.kind === "color") {
      setMode("color");
      setColor(background.color.slice(0, 7));
      setSelectedImage(null);
      return;
    }

    setMode("image");
    setFit(background?.fit ?? "cover");
    setSelectedImage(
      imagesQuery.data?.find((image) => image._id === background?.fileId) ??
        null
    );
  }, [show, background, imagesQuery.data]);

  function close() {
    setShow(false);
  }

  function applyColor() {
    modifySceneProp("background", { kind: "color", color });
    close();
  }

  function applyImage(image: UploadedFile) {
    modifySceneProp("background", toImageBackground(image, fit));
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
      await queryClient.invalidateQueries({
        queryKey: ["images", scenarioId],
      });
      applyImage(image);
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
      <div role="tablist" className="tabs tabs-box mb-4">
        <button
          type="button"
          role="tab"
          className={`tab gap-2 ${mode === "color" ? "tab-active" : ""}`}
          onClick={() => setMode("color")}
        >
          <PaletteIcon size={16} />
          Solid colour
        </button>
        <button
          type="button"
          role="tab"
          className={`tab gap-2 ${mode === "image" ? "tab-active" : ""}`}
          onClick={() => setMode("image")}
        >
          <ImageIcon size={16} />
          Image
        </button>
      </div>

      {mode === "color" ? (
        <div className="grid grid-cols-[minmax(12rem,1fr)_2fr] gap-6 items-start">
          <fieldset className="fieldset">
            <label className="label" htmlFor="background-color">
              Background colour
            </label>
            <div className="flex items-center gap-3">
              <input
                id="background-color"
                type="color"
                className="size-12 cursor-pointer rounded-sm bg-transparent"
                value={color}
                onChange={(event) => setColor(event.target.value)}
              />
              <span className="font-mono uppercase">{color}</span>
            </div>
            <button
              type="button"
              className="btn btn-primary mt-4"
              onClick={applyColor}
            >
              Apply colour
            </button>
          </fieldset>
          <div
            className="aspect-video w-full rounded-sm border border-base-300"
            style={{ backgroundColor: color }}
            aria-label={`Background colour preview: ${color}`}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-end gap-3">
            <fieldset className="fieldset flex-1">
              <label className="label" htmlFor="background-fit">
                Image fit
              </label>
              <select
                id="background-fit"
                className="select w-full"
                value={fit}
                onChange={(event) =>
                  setFit(event.target.value as BackgroundFit)
                }
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
              Upload image
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*"
            onChange={(event) => void handleFileChange(event)}
          />

          <div className="min-h-0">
            <p className="label mb-2">Uploaded images</p>
            {imagesQuery.isLoading ? (
              <p>Loading images...</p>
            ) : imagesQuery.data?.length ? (
              <div className="max-h-[45vh] overflow-y-auto pr-1">
                <ImageListContainer
                  data={imagesQuery.data}
                  selectedId={selectedImage?._id}
                  onItemSelected={(image: UploadedFile) =>
                    setSelectedImage(image)
                  }
                />
              </div>
            ) : (
              <div className="rounded-sm bg-base-200 p-6 text-center">
                No uploaded images yet.
              </div>
            )}
          </div>

          <button
            type="button"
            className="btn btn-primary self-end"
            disabled={!selectedImage}
            onClick={() => selectedImage && applyImage(selectedImage)}
          >
            Set background
          </button>
        </div>
      )}

      {background && (
        <>
          <div className="divider" />
          <button
            type="button"
            className="btn btn-ghost text-error"
            onClick={removeBackground}
          >
            Remove background
          </button>
        </>
      )}
    </ModalDialog>
  );
}

export default BackgroundMenu;
