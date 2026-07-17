import { useContext, useRef, useState, type Context } from "react";
import useVisualScene from "../stores/visual";
import EditAudioComponent from "./EditAudioComponent";
import type { UploadedFile } from "../types";
import type { AxiosResponse } from "axios";
import type { User } from "firebase/auth";
import { api } from "../../../util/api";
import { add } from "../scene/operations/modifiers";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import AuthenticationContext from "../../../context/AuthenticationContext";
import { useParams } from "react-router-dom";
import { PlusIcon } from "lucide-react";
import AudioSelectModal from "./AudioSelectModal";

// before calling validation of file should already be done
async function addNewAudio(file: File, scenarioId: string, user: User) {
  const formData = new FormData();
  formData.append("file", file);

  const response = (await api.post(
    user,
    `api/files/${scenarioId}`,
    formData
  )) as AxiosResponse<UploadedFile>;

  const newAudio = {
    fileId: response.data._id,
    type: "audio",
    name: response.data.name,
    url: response.data.url,
    loop: false,
  };

  add(newAudio);
}

function AudioManager() {
  const components = useVisualScene((state) => state.components);
  const { user } = useContext(AuthenticationContext as Context<{ user: User }>);
  const { scenarioId } = useParams<{ scenarioId: string }>();
  const queryClient = useQueryClient();

  const [modalOpen, setModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const audios = Object.values(components).filter((c) => c.type === "audio");

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file?.type.startsWith("audio/")) {
      toast.error("Invalid audio file");
      return;
    }

    addNewAudio(file, scenarioId, user)
      .then(() => {
        void queryClient.invalidateQueries({
          queryKey: ["audios", scenarioId],
        });
      })
      .catch((e) => {
        console.error(e);
        toast.error("Audio upload failed");
      });
  }

  const showFilePicker = () => {
    fileInputRef.current?.click();
  };

  function showModal() {
    setModalOpen(true);
  }

  return (
    <>
      <div className="collapse overflow-visible collapse-arrow bg-base-300 rounded-sm text-s">
        <input type="checkbox" />
        <div className="collapse-title flex items-center justify-between">
          Audio Elements
          <div className="dropdown dropdown-end z-1">
            <div tabIndex={0} role="button">
              <PlusIcon size={18} />
            </div>
            <ul
              tabIndex={-1}
              className="dropdown-content menu bg-base-300 rounded-box z-1 w-52 p-2 shadow-sm top-[38px]"
            >
              <li>
                <a onClick={showFilePicker}>Upload New Audio</a>
              </li>
              <li>
                <a onClick={showModal}>Select Existing Audio</a>
              </li>
            </ul>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
          accept="audio/*"
        />

        <div className="collapse-content text--1 bg-base-200 px-0">
          {audios.map((audio) => (
            <EditAudioComponent component={audio} key={audio.id} />
          ))}
        </div>
      </div>

      <AudioSelectModal open={modalOpen} setOpen={setModalOpen} />
    </>
  );
}

export default AudioManager;
