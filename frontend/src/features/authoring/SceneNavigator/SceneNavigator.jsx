import SceneContext from "context/SceneContext";
import { useContext, useEffect, useState } from "react";
import { useHistory, useParams } from "react-router-dom";
import styles from "./SceneNavigator.module.scss";
import SceneListItem from "./SceneListItem";
import Thumbnail from "../components/Thumbnail";
import DashedCard from "../../../components/DashedCard";
import { useAuthPost } from "../../../hooks/crudHooks";
import toast from "react-hot-toast";

const SceneNavigator = ({ saveScene }) => {
  const [thumbnails, setThumbnails] = useState(null);
  const { scenes, currentScene, currentSceneRef, setCurrentScene, reFetch } =
    useContext(SceneContext);
  const { scenarioId } = useParams();
  const history = useHistory();
  const { error, postRequest } = useAuthPost(
    `/api/scenario/${scenarioId}/scene`
  );

  const addScene = async () => {
    await postRequest({ name: `Scene ${scenes.length}` });
    reFetch();
  };

  useEffect(() => {
    if (!scenes?.length) return;

    setThumbnails(
      scenes.map((scene, index) => ({
        sceneId: scene._id,
        sceneListItem: (
          <>
            <p
              className={styles.sceneText}
              style={
                currentScene._id === scene._id ? { color: "#035084" } : null
              }
            >
              {index + 1}
            </p>
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
          </>
        ),
      }))
    );
  }, [scenes, currentScene]);

  if (error) {
    console.error(error);
    toast.error("Something went wrong, unable to create scene.");
    // TODO: we should have more comprehensive error handling
  }

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
          <DashedCard height={94} onClick={addScene} />
        </ul>
      </div>
    )
  );
};

export default SceneNavigator;
