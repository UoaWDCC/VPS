import { PlusIcon } from "lucide-react";
import { useContext, useRef } from "react";
import useVisualScene from "../stores/visual";
import { add } from "../scene/operations/modifiers";
import EditAudioComponent from "../audio/EditAudioComponent";
import { api } from "../../../util/api";
import toast from "react-hot-toast";
import { useParams } from "react-router-dom";
import AuthenticationContext from "../../../context/AuthenticationContext";

async function addAudio(file, scenarioId, user) {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post(user, `api/files/${scenarioId}`, formData);

    const newAudio = {
      fileId: response.data._id,
      type: "audio",
      name: response.data.name,
      url: response.data.url,
      loop: false,
    };

    add(newAudio);
  } catch (e) {
    console.error(e);
    toast.error("Audio upload failed");
  }
}

function AudioManager() {
  const { scenarioId } = useParams();
  const { user } = useContext(AuthenticationContext);

  const components = useVisualScene((state) => state.components);

  const inputRef = useRef(null);

  const audios = Object.values(components).filter((c) => c.type === "audio");

  async function handleFileInput(e) {
    addAudio(e.target.files[0], scenarioId, user);
    inputRef.current.value = null;
  }

  function createNew() {
    inputRef.current?.click();
  }

  return (
    <>
      <div className="collapse overflow-visible collapse-arrow bg-base-300 rounded-sm text-s">
        <input type="checkbox" />
        <div className="collapse-title flex items-center justify-between">
          Audio Elements
          <PlusIcon size={18} onClick={createNew} className="z-1" />
        </div>
        <div className="collapse-content text--1 bg-base-200 px-0">
          {audios.map((audio, i) => (
            <EditAudioComponent component={audio} key={i} />
          ))}
        </div>
      </div>
      <input
        type="file"
        accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac,.webm"
        ref={inputRef}
        className="hidden"
        onChange={handleFileInput}
      />
    </>
  );
}

export default AudioManager;
