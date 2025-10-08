import { PlusIcon } from "lucide-react";
import { useRef, useState } from "react";
import useVisualScene from "../stores/visual";
import { v4 as uuidv4 } from "uuid";
import { add } from "../scene/operations/modifiers";
import EditAudioComponent from "../audio/EditAudioComponent";

async function addAudio(fileObject) {
    const url = await URL.createObjectURL(fileObject);
    const newAudio = {
        type: "audio",
        name: fileObject.name,
        fileObject,
        url,
        loop: false,
        id: uuidv4(),
    };

    add(newAudio);
}

function AudioManager() {
    const components = useVisualScene(state => state.components);
    const [createOpen, setCreateOpen] = useState(false);

    const inputRef = useRef(null);

    const audios = Object.values(components).filter(c => c.type === "audio");

    async function handleFileInput(e) {
        addAudio(e.target.files[0]);
        inputRef.current.value = null;
    };

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
                accept=".mp3"
                ref={inputRef}
                className="hidden"
                onChange={handleFileInput}
            />
        </>
    );
}

export default AudioManager;
