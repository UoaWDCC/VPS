import { useContext, useRef, useState, type Context } from "react";
import useVisualScene from "../stores/visual";
import type { UploadedFile } from "../types";
import type { AxiosResponse } from "axios";
import type { User } from "firebase/auth";
import { api } from "../../../util/api";
import { add } from "../scene/operations/modifiers";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import AuthenticationContext from "../../../context/AuthenticationContext";
import { useParams } from "react-router-dom";
import { ListMusicIcon, PlusIcon } from "lucide-react";
import EditAudioComponent from "../audio/EditAudioComponent";
import AudioSelectModal from "../audio/AudioSelectModal";

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

function AudioPanel() {
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

  function showFilePicker() {
    fileInputRef.current?.click();
  }

  return (
    <>
      <div className="flex gap-2">
        <button
          type="button"
          className="btn btn-panel"
          onClick={showFilePicker}
        >
          <PlusIcon size={18} />
          Upload New Audio
        </button>
        <button
          type="button"
          className="btn btn-panel"
          onClick={() => setModalOpen(true)}
        >
          <ListMusicIcon size={18} />
          Select Existing Audio
        </button>
      </div>

      <ul className="mt-3 gap-1 flex flex-col">
        {audios.length > 0 ? (
          audios.map((audio) => (
            <EditAudioComponent component={audio} key={audio.id} />
          ))
        ) : (
          <p className="text-xs opacity-70">No audio elements yet.</p>
        )}
      </ul>

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
        accept="audio/*"
      />

      <AudioSelectModal open={modalOpen} setOpen={setModalOpen} />
    </>
  );
}

export default AudioPanel;
