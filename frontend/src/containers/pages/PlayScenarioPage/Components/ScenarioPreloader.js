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
    <div key={scene._id}>
      {fullScene?.components.map((component) => {
        if (component.type === "FIREBASEIMAGE") {
          return (
            <PreloadFirebaseImage component={component} key={component.id} />
          );
        }
        if (component.type === "IMAGE") {
          return (
            <PreloadGoogleDriveImage component={component} key={component.id} />
          );
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
  return null;
}

function PreloadFirebaseImage({ component }) {
  const img = new Image();
  img.src = component.url;
  return null;
}

function ScenarioPreloader() {
  const [scenes, setScenes] = useState(null);
  const { scenarioId } = useContext(PlayScenarioContext);
  if (scenarioId) {
    useGet(`api/scenario/${scenarioId}/scene`, setScenes, false);
  }

  return (
    <div key={scenarioId}>
      {scenes?.map((scene) => (
        <ImagePreloader scenarioId={scenarioId} scene={scene} key={scene._id} />
      ))}
    </div>
  );
}

export default ScenarioPreloader;
