import { useContext } from "react";
import RightContextMenu from "../../../components/ContextMenu/RightContextMenu";
import { api, handleGeneric } from "../../../util/api";
import styles from "./SceneNavigator.module.scss";
import Thumbnail from "../components/Thumbnail";
import AuthenticationContext from "../../../context/AuthenticationContext";
import SceneContext from "../../../context/SceneContext";
import { useParams, useHistory } from "react-router-dom";
import { getScene } from "../scene/scene";
import useEditorStore from "../stores/editor";
import { replace } from "../scene/operations/modifiers";
import { Paper } from "@material-ui/core";
import { MenuItem, MenuList } from "@mui/material";
import { handle } from "../../../components/ContextMenu/portal";

const SceneMenu = ({ id, duplicateScene, deleteScene }: { id: string, duplicateScene: (id: string) => void, deleteScene: (id: string) => void }) => {
    return (
        <Paper>
            <MenuList>
                <MenuItem onClick={handle(duplicateScene, id)}>Duplicate</MenuItem>
                <MenuItem onClick={handle(deleteScene, id)}>Delete</MenuItem>
            </MenuList>
        </Paper>
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
