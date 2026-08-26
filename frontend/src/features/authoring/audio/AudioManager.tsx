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
import { HeadphonesIcon } from "lucide-react";
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
  const hasAudios = audios.length > 0;

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

  return (
    <>
      <div className="collapse w-24 overflow-visible bg-base-300 rounded-sm text-s">
        {hasAudios && <input type="checkbox" />}
        <div className="collapse-title w-24 h-24 min-h-0 p-2 flex flex-col items-center justify-center gap-1">
          <HeadphonesIcon size={30} />
          <span className="text-xs text-center">Audio Elements</span>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
          accept="audio/*"
        />

        {hasAudios && (
          <div className="collapse-content text--1 bg-base-200 px-0">
            {audios.map((audio) => (
              <EditAudioComponent component={audio} key={audio.id} />
            ))}
          </div>
        )}
      </div>

      <AudioSelectModal open={modalOpen} setOpen={setModalOpen} />
    </>
  );
}

export default AudioManager;
