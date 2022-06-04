import React, { useEffect, useState, useContext } from "react";
import { useParams, useHistory } from "react-router-dom";
import SceneContext from "../../../../context/SceneContext";
import Thumbnail from "../../../../components/Thumbnail";
import styles from "../../../../styling/SceneNavigator.module.scss";

const SceneNavigator = (props) => {
  const [thumbnails, setThumbnails] = useState(null);
  const [sceneIndex, setSceneIndex] = useState(null);
  const { scenes, currentSceneRef, setCurrentScene } = useContext(SceneContext);
  const { scenarioId } = useParams();
  const history = useHistory();
  const { saveScene } = props;

  useEffect(() => {
    if (scenes.length !== 0) {
      setThumbnails(
        scenes.map((scene, index) => (
          <button
            type="button"
            onClick={() => {
              if (currentSceneRef.current._id === scene._id) return;
              setCurrentScene(scene);
              setSceneIndex(index);
              saveScene();
              history.push({
                pathname: `/scenario/${scenarioId}/scene/${scene._id}`,
              });
            }}
            className={styles.sceneButton}
            style={
              sceneIndex === index ? { border: "3px solid #008a7b" } : null
            }
            key={scene._id}
          >
            <p
              className={styles.sceneText}
              style={sceneIndex === index ? { color: "#008a7b" } : null}
            >
              {index + 1}
            </p>
            <Thumbnail
              url={`${process.env.PUBLIC_URL}/play/${scenarioId}/${scene._id}`}
              width="160"
              height="90"
            />
          </button>
        ))
      );
    }
  }, [scenes]);

  return <div className={styles.sceneNavigator}>{thumbnails}</div>;
};

export default SceneNavigator;
