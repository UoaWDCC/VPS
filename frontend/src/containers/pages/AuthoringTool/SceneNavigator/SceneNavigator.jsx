import Thumbnail from "components/Thumbnail";
import SceneContext from "context/SceneContext";
import { useContext, useEffect, useState } from "react";
import { useHistory, useParams } from "react-router-dom";
import styles from "styling/SceneNavigator.module.scss";
import SceneListItem from "./SceneListItem";

const SceneNavigator = ({ saveScene }) => {
  const [thumbnails, setThumbnails] = useState(null);
  const { scenes, currentScene, currentSceneRef, setCurrentScene } =
    useContext(SceneContext);
  const { scenarioId } = useParams();
  const history = useHistory();

  useEffect(() => {
    if (scenes !== undefined) {
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
                <Thumbnail
                  url={`${process.env.PUBLIC_URL}/play/${scenarioId}/${scene._id}`}
                  width="160"
                  height="90"
                />
              </button>
            </>
          ),
        }))
      );
    }
  }, [scenes, currentScene]);

  return (
    thumbnails && (
      <div style={{ display: "flex", position: "relative" }}>
        <ul className={styles.sceneNavigator}>
          {thumbnails.map(({ sceneListItem: thumbnail, sceneId }) => (
            <SceneListItem
              {...{
                thumbnail,
                sceneId,
                key: sceneId,
              }}
            />
          ))}
        </ul>
      </div>
    )
  );
};

export default SceneNavigator;
