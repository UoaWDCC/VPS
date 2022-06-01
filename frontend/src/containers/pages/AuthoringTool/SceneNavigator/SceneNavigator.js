import React, { useEffect, useState, useContext } from "react";
import { useParams, useHistory } from "react-router-dom";
import SceneContext from "../../../../context/SceneContext";
import Thumbnail from "../../../../components/Thumbnail";

const sceneNavigatorStyle = {
  width: "10vw",
  height: "100%",
  backgroundColor: "#f0f0f0",
  filter: "drop-shadow(2.5px 0 5px rgba(0, 0, 0, 0.1))",
  padding: "1rem 1rem 1rem 2rem",
  display: "flex",
  flexDirection: "column",
  overflow: "scroll",
  gap: "1rem",
};

const navigatorButtonStyle = {
  padding: ".25rem",
  cursor: "pointer",
  position: "relative",
};

const thumbnailStyle = {
  height: "auto",
};

const navigatorTextStyle = {
  zIndex: "2",
  position: "absolute",
  left: "-20px",
  top: "-10px",
};

const SceneNavigator = (props) => {
  const [thumbnails, setThumbnails] = useState(null);
  const { scenes, setCurrentScene } = useContext(SceneContext);
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
              setCurrentScene(scene);
              saveScene();
              history.push({
                pathname: `/scenario/${scenarioId}/scene/${scene._id}`,
              });
            }}
            style={navigatorButtonStyle}
            key={scene._id}
          >
            <p style={navigatorTextStyle}>{index + 1}</p>
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
