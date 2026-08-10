import { useParams } from "react-router-dom";
import ModalDialog from "../../../components/ModalDialogue";
import {
  useContext,
  useState,
  type Context,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { User } from "firebase/auth";
import { add } from "../scene/operations/modifiers";
import { api } from "../../../util/api";
import type { AxiosResponse } from "axios";
import AuthenticationContext from "../../../context/AuthenticationContext";
import { useQuery } from "@tanstack/react-query";
import AudioListContainer from "./AudioListContainer";
import type { UploadedFile } from "../types";

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

function AudioSelectModal({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}) {
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
      title="Select Audio"
      open={open}
      onClose={() => {
        setOpen(false);
        setSelectedAudio(null);
      }}
    >
      {
        <AudioListContainer
          data={audiosQuery.data}
          selectedId={selectedAudio?._id}
          onItemSelected={(audio: UploadedFile) => setSelectedAudio(audio)}
        />
      }
      <div className="modal-action">
        <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
          ✕
        </button>
        <button
          className="btn"
          disabled={!selectedAudio}
          onClick={handleSubmit}
        >
          Add
        </button>
      </div>
    </ModalDialog>
  );
}

export default AudioSelectModal;
