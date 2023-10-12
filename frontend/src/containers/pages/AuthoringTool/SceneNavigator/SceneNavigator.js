import React, { useEffect, useState, useContext, useRef } from "react";
import { useParams, useHistory } from "react-router-dom";
import SceneContext from "context/SceneContext";
import Thumbnail from "components/Thumbnail";
import styles from "styling/SceneNavigator.module.scss";
import SceneListItem from "./SceneListItem";
import SceneTagInput from "./SceneTagInput";

const SceneNavigator = ({ saveScene }) => {
  const [thumbnails, setThumbnails] = useState(null);
  const { scenes, currentScene, currentSceneRef, setCurrentScene } =
    useContext(SceneContext);
  const { scenarioId } = useParams();
  const history = useHistory();

  // showing tag modal

  const [showingTagInputFor, showTagInputFor] = useState(null);

  function getIndexOfSceneId(sceneId) {
    if (!thumbnails) return -1;
    return thumbnails.findIndex((thumbnail) => thumbnail.sceneId === sceneId);
  }

  function changeTag(sceneId, newTag) {
    const sceneIndex = getIndexOfSceneId(sceneId);

    // console.table({ sceneIndex, newTag });
    setThumbnails((currentThumbnails) => {
      currentThumbnails[sceneIndex].tag = newTag;
      return [...currentThumbnails];
    });
  }

  useEffect(() => {
    if (scenes !== undefined) {
      setThumbnails(
        scenes.map((scene, index) => ({
          sceneId: scene._id,
          tag: "D",
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

  // for the scene/tag inputs
  const [selectedTagEl, selectTagEl] = useState(null);

  return (
    thumbnails && (
      <div style={{ display: "flex", position: "relative" }}>
        <ul className={styles.sceneNavigator}>
          {thumbnails.map(({ sceneListItem: thumbnail, sceneId, tag }) => (
            <SceneListItem
              {...{
                thumbnail,
                sceneId,
                tag,
                showingTagInputFor,
                showTagInputFor,
                selectTagEl,
                key: sceneId,
              }}
            />
          ))}
        </ul>

        {showingTagInputFor && (
          <SceneTagInput
            {...{
              selectedTagEl,
              changeTag,
              showTagInputFor,
              showingTagInputFor,
            }}
          />
        )}
      </div>
    )
  );
};

export default SceneNavigator;
