import { useGet } from "hooks/crudHooks";

/**
 * This component preloads firebase and google drive images of a scene
 */
function ImagePreloader({ scene }) {
  return (
    <div key={scene._id}>
      {scene?.components.map((component) => {
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

/**
 * This component preloads images from google drive
 */
function PreloadGoogleDriveImage({ component }) {
  const img = new Image();
  function setImage(image) {
    img.src = image.url;
  }
  useGet(`/api/image/${component.imageId}`, setImage, false);
  return null;
}

/**
 * This component preloads images from Firebase
 */
function PreloadFirebaseImage({ component }) {
  const img = new Image();
  img.src = component.url;
  return null;
}

/**
 * This component preloads the images in all scenes of a for better performance when playing.
 * @component
 */
function ScenarioPreloader({ scenarioId, graph }) {
  return (
    <div key={scenarioId}>
      {graph.getScenes().map((scene) => (
        <ImagePreloader scene={scene} key={scene._id} />
      ))}
    </div>
  );
}

export default ScenarioPreloader;
