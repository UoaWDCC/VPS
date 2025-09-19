import SceneContext from "context/SceneContext";
import { useContext, useEffect, useState } from "react";
import { useHistory, useParams } from "react-router-dom";
import styles from "./SceneNavigator.module.scss";
import SceneListItem from "./SceneListItem";
import Thumbnail from "../components/Thumbnail";
import RightContextMenu from "../../../components/ContextMenu/RightContextMenu";
import { MenuItem, MenuList, Paper } from "@material-ui/core";
import AuthenticationContext from "../../../context/AuthenticationContext";
import { handle } from "../../../components/ContextMenu/portal";
import { api, handleGeneric } from "../../../util/api";
import DashedCard from "../../../components/DashedCard";

const SceneMenu = ({ id, deleteScene, duplicateScene }) => {
  return (
    <Paper>
      <MenuList>
        <MenuItem onClick={handle(duplicateScene, id)}>Duplicate 123</MenuItem>
        <MenuItem onClick={handle(deleteScene, id)}>Delete</MenuItem>
      </MenuList>
    </Paper>
  );
};

const SceneNavigator = ({ saveScene }) => {
  const [thumbnails, setThumbnails] = useState(null);
  const { scenes, currentScene, currentSceneRef, setCurrentScene, reFetch } =
    useContext(SceneContext);
  const { scenarioId } = useParams();
  const history = useHistory();
  const { user } = useContext(AuthenticationContext);

  const deleteScene = async (id) => {
    api
      .delete(user, `/api/scenario/${scenarioId}/scene/${id}`)
      .then(reFetch)
      .catch(handleGeneric);
  };

  const duplicateScene = async (id) => {
    api
      .post(user, `/api/scenario/${scenarioId}/scene/duplicate/${id}`, {})
      .then(reFetch)
      .catch(handleGeneric);
  };

  const addScene = async () => {
    api
      .post(user, `/api/scenario/${scenarioId}/scene`, {
        name: `Scene ${scenes.length}`,
      })
      .then(reFetch)
      .catch(handleGeneric);
  };

  useEffect(() => {
    if (!scenes?.length) return;

    setThumbnails(
      scenes.map((scene, index) => ({
        sceneId: scene._id,
        sceneListItem: (
          <RightContextMenu
            menu={SceneMenu({ id: scene._id, deleteScene, duplicateScene })}
          >
            <div className="flex items-center gap-2.5">
              <p className="w-4">{index + 1}</p>
              <button
                type="button"
                onClick={() => {
                  if (currentSceneRef.current._id === scene._id) return;
                  setCurrentScene(scene);
                  saveScene();
                  history.push({
                    pathname: `/scenario/${scenarioId}/scene/${scene._id}`,
                  });
                }}
                className={styles.sceneButton}
                style={
                  currentScene._id === scene._id
                    ? {
                        border: "3px solid #035084",
                      }
                    : null
                }
                key={scene._id}
              >
                <Thumbnail components={scene.components} />
              </button>
            </div>
          </RightContextMenu>
        ),
      }))
    );
  }, [scenes, currentScene]);

  return (
    thumbnails && (
      <div style={{ display: "flex", position: "relative" }}>
        <ul className={styles.sceneNavigator}>
          {thumbnails.map(({ sceneListItem: thumbnail, sceneId }) => (
            <SceneListItem
              thumbnail={thumbnail}
              sceneId={sceneId}
              key={sceneId}
            />
          ))}
          <div className="w-full pl-6.5">
            <DashedCard height={94} onClick={addScene} />
          </div>
        </ul>
      </div>
    )
  );
};

export default SceneNavigator;
