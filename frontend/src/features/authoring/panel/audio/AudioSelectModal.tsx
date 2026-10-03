import { useParams } from "react-router-dom";
import {
  useContext,
  useState,
  type Context,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { User } from "firebase/auth";
import type { AxiosResponse } from "axios";
import { useQuery } from "@tanstack/react-query";
import type { UploadedFile } from "../../types";
import { add } from "../../scene/operations/modifiers";
import { api } from "../../../../util/api";
import AuthenticationContext from "../../../../context/AuthenticationContext";
import ModalDialog from "../../../../components/ModalDialogue";
import AudioSelectList from "./AudioSelectList";

function addExistingAudio(audio: UploadedFile) {
  const newAudio = {
    fileId: audio._id,
    type: "audio",
    name: audio.name,
    url: audio.url,
    loop: false,
  };
  add(newAudio);
}

async function getAudios(user: User, scenarioId: string) {
  const res = (await api.get(
    user,
    `api/files/${scenarioId}/type/audio`
  )) as AxiosResponse<UploadedFile[]>;
  return res.data;
}

interface AudioSelectModalProps {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}

function AudioSelectModal({ open, setOpen }: AudioSelectModalProps) {
  const { scenarioId } = useParams<{ scenarioId: string }>();
  const [selectedAudio, setSelectedAudio] = useState<UploadedFile | null>(null);

  const { user } = useContext(AuthenticationContext as Context<{ user: User }>);

  const audiosQuery = useQuery({
    queryFn: () => getAudios(user, scenarioId),
    queryKey: ["audios", scenarioId],
    enabled: !!scenarioId,
  });

  function handleSubmit() {
    if (!selectedAudio) return;
    setOpen(false);
    addExistingAudio(selectedAudio);
    setSelectedAudio(null);
  }

  return (
    <ModalDialog
      title="Select Audio Track"
      open={open}
      onClose={() => {
        setOpen(false);
        setSelectedAudio(null);
      }}
    >
      <AudioSelectList
        data={audiosQuery.data}
        selectedId={selectedAudio?._id}
        onItemSelected={(audio: UploadedFile) => setSelectedAudio(audio)}
      />
      <div className="modal-action">
        <button
          className="btn"
          role="button"
          disabled={!selectedAudio}
          onClick={handleSubmit}
        >
          Add To Scene
        </button>
      </div>
    </ModalDialog>
  );
}

export default AudioSelectModal;
