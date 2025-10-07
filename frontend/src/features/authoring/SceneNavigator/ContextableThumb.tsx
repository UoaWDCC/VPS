import { useContext } from "react";
import RightContextMenu from "../../../components/ContextMenu/RightContextMenu";
import { api, handleGeneric } from "../../../util/api";
import Thumbnail from "../components/Thumbnail";
import AuthenticationContext from "../../../context/AuthenticationContext";
import SceneContext from "../../../context/SceneContext";
import { useParams, useHistory } from "react-router-dom";
import { getScene } from "../scene/scene";
import useEditorStore from "../stores/editor";
import { replace } from "../scene/operations/modifiers";
import { handle } from "../../../components/ContextMenu/portal";
import { CopyPlusIcon, Trash2Icon } from "lucide-react";

const SceneMenu = ({ id, duplicateScene, deleteScene }: { id: string, duplicateScene: (id: string) => void, deleteScene: (id: string) => void }) => {
    return (
        <ul className="menu bg-base-200 rounded-box w-fit">
            <li><a onClick={handle(duplicateScene, id)}><CopyPlusIcon size={16} />Duplicate</a></li>
            <li><a onClick={handle(deleteScene, id)}><Trash2Icon size={16} />Delete</a></li>
        </ul>
    );
};

function ContextableThumb({ scene, index, active }: { scene: Record<string, any>, index: number, active: boolean }) {
    const { user } = useContext(AuthenticationContext);

    const { scenarioId } = useParams();
    const history = useHistory();

    const { reFetch, saveScene, deleteScene } = useContext(SceneContext);

    const duplicateScene = async (id: string) => {
        api
            .post(user, `/api/scenario/${scenarioId}/scene/duplicate/${id}`, {})
            .then(reFetch)
            .catch(handleGeneric);
    };

    function switchScene(scene: Record<string, any>) {
        if (active) return;

        saveScene(structuredClone(getScene()));
        useEditorStore.getState().clear();
        replace(scene);

        localStorage.setItem(`${scenarioId}:activeScene`, scene._id);

        const pathname = `/scenario/${scenarioId}/scene/${scene._id}`;
        history.push({ pathname });
    }

    return (
        <RightContextMenu
            menu={SceneMenu({
                id: scene._id,
                deleteScene,
                duplicateScene,
            })}
        >
            <div className="flex">
                <p className="w-4 text--1">{index + 1}</p>
                <button
                    type="button"
                    onMouseDown={() => switchScene(scene)}
                    className="w-[160px] relative rounded-sm overflow-hidden border-3 hover:border-primary"
                    style={active ? { border: "3px solid #035084" } : {}}
                    key={scene._id}
                >
                    <Thumbnail components={scene.components} />
                </button>
            </div>
        </RightContextMenu>
    )
}

export default ContextableThumb;
