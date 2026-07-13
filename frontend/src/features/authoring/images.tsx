import { useContext, useRef, useState, type Context } from "react";
import { useQuery } from "@tanstack/react-query";
import ImageListContainer from "../../components/ListContainer/ImageListContainer";
import { type User } from "firebase/auth";
import { useParams } from "react-router-dom";
import { ImageIcon } from "lucide-react";
import { add } from "./scene/operations/modifiers";
import { defaults } from "./scene/operations/component";
import type { ImageComponent } from "./types";
import { api, handleGeneric } from "../../util/api";
import ModalDialog from "../../components/ModalDialogue";
import useEditorStore from "./stores/editor.ts";
import toast from "react-hot-toast";
import AuthenticationContext from "../../context/AuthenticationContext.jsx";
import type { AxiosResponse } from "axios";

interface Image {
  _id: string;
  name: string;
  type: "image";
  path: string;
  url: string;
  contentType: string;
  size: number;
  uploaderUid: string;
  scenarioId: string;
  refCount: number;
  deletedAt: Date | null;
}

async function addExistingImage(image: Image) {
  const newImage = structuredClone(defaults.image) as Partial<ImageComponent>;
  newImage.fileId = image._id;
  newImage.href = image.url;
  newImage.bounds!.verts = await getImageDimensions(image.url);
  add(newImage);
}

async function addNewImage(file: File, scenarioId: string, user: User) {
  const { setLoading } = useEditorStore.getState();
  setLoading(true);

  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("scenarioId", scenarioId);

    const response = (await api.post(
      user,
      "api/files/upload",
      formData
    )) as AxiosResponse<Image>;

    const newImage = structuredClone(defaults.image) as Partial<ImageComponent>;
    newImage.fileId = response.data._id;
    newImage.href = response.data.url;
    newImage.bounds!.verts = await getImageDimensions(response.data.url);
    add(newImage);
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

async function getImages(user: User, scenarioId: string) {
  const res = (await api.get(user, `api/image/${scenarioId}`)) as AxiosResponse<
    Image[]
  >;
  return res.data;
}

function ImageCreateMenu() {
  const { scenarioId } = useParams<{ scenarioId: string }>();
  const [selectedImage, setSelectedImage] = useState<Image | null>(null);

  const { user } = useContext(AuthenticationContext as Context<{ user: User }>);
  const [modalOpen, setModalOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const imagesQuery = useQuery({
    queryFn: () => getImages(user, scenarioId),
    queryKey: ["images", scenarioId],
    enabled: !!scenarioId,
  });

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) addNewImage(file, scenarioId, user).catch(handleGeneric);
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
    void addExistingImage(selectedImage);
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
          onItemSelected={(img: Image) => setSelectedImage(img)}
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
