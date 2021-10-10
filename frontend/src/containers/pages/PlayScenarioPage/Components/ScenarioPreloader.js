import React, { useContext, useState } from "react";
import PlayScenarioContext from "../../../../context/PlayScenarioContext";
import { useGet } from "../../../../hooks/crudHooks";

function ImagePreloader({ scenarioId, scene }) {
  const [fullScene, setFullScene] = useState();
  useGet(
    `/api/scenario/${scenarioId}/scene/full/${scene._id}`,
    setFullScene,
    false
  );
  return (
    <div>
      {fullScene?.components.map((component) => {
        if (component.type === "FIREBASEIMAGE") {
          return <PreloadFirebaseImage component={component} />;
        }
        if (component.type === "IMAGE") {
          return <PreloadGoogleDriveImage component={component} />;
        }
        return null;
      })}
    </div>
  );
}

function PreloadGoogleDriveImage({ component }) {
  const img = new Image();
  function setImage(image) {
    img.src = image.url;
  }
  useGet(`/api/image/${component.imageId}`, setImage, false);
  return <div />;
}

function PreloadFirebaseImage({ component }) {
  const img = new Image();
  img.src = component.url;
  return <div />;
}

function ScenarioPreloader() {
  const [scenes, setScenes] = useState(null);
  const { scenarioId } = useContext(PlayScenarioContext);
  if (scenarioId) {
    useGet(`api/scenario/${scenarioId}/scene`, setScenes, false);
  }

  return (
    <div>
      {scenes?.map((scene) => (
        <ImagePreloader scenarioId={scenarioId} scene={scene} />
      ))}
    </div>
  );
}

export default ScenarioPreloader;
