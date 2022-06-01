import React, { useEffect, useState, useContext } from "react";
import { useParams, useHistory, useRouteMatch } from "react-router-dom";
import SceneContext from "../../../../context/SceneContext";
import Thumbnail from "../../../../components/Thumbnail";

const sceneNavigatorStyle = {
  width: "10vw",
  height: "100%",
  backgroundColor: "#f0f0f0",
  filter: "drop-shadow(2.5px 0 5px rgba(0, 0, 0, 0.1))",
  padding: "1rem",
  display: "flex",
  flexDirection: "column",
  overflow: "scroll",
  scrollbarWidth: "none",
  gap: "1rem",
};

const navigatorButtonStyle = {
  padding: ".25rem",
  cursor: "pointer",
};

const thumbnailStyle = {
  height: "auto",
};

const SceneNavigator = () => {
  const [thumbnails, setThumbnails] = useState(null);
  const { scenes, setCurrentScene } = useContext(SceneContext);
  const { scenarioId } = useParams();
  const history = useHistory();

  useEffect(() => {
    if (scenes.length !== 0) {
      setThumbnails(
        scenes.map((scene) => (
          <button
            type="button"
            onClick={() => {
              setCurrentScene(scene);
              history.push({
                pathname: `/scenario/${scenarioId}/scene/${scene._id}`,
              });
            }}
            style={navigatorButtonStyle}
            key={scene._id}
          >
            <Thumbnail
              url={`${process.env.PUBLIC_URL}/play/${scenarioId}/${scene._id}`}
              style={thumbnailStyle}
              width="133"
              height="75"
            />
          </button>
        ))
      );
    }
  }, [scenes]);

  return <div style={sceneNavigatorStyle}>{thumbnails}</div>;
};

export default SceneNavigator;
