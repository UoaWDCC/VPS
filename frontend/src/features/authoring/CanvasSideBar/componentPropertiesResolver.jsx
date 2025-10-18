import ButtonPropertiesComponent from "features/authoring/CanvasSideBar/ComponentProperties/ButtonPropertiesComponent";
import FirebaseAudioPropertiesComponent from "features/authoring/CanvasSideBar/ComponentProperties/FirebaseAudioPropertiesComponent";
import ImagePropertiesComponent from "features/authoring/CanvasSideBar/ComponentProperties/ImagePropertiesComponent";
import SpeechTextPropertiesComponent from "features/authoring/CanvasSideBar/ComponentProperties/SpeechTextPropertiesComponent";
import TextPropertiesComponent from "features/authoring/CanvasSideBar/ComponentProperties/TextPropertiesComponent";
/**
 * This function returns the appropriate properties component for a scene component object
 *
 * @example
 * componentPropertiesResolver(currentScene.components[selectedComponentIndex], selectedComponentIndex)
 */
export default function componentPropertiesResolver(component, componentIndex) {
  switch (component?.type) {
    // ADD NEW COMPONENT TYPES HERE
    case "BUTTON":
      return (
        <ButtonPropertiesComponent
          component={component}
          componentIndex={componentIndex}
        />
      );

    case "SPEECHTEXT":
      return (
        <SpeechTextPropertiesComponent
          component={component}
          componentIndex={componentIndex}
        />
      );
    case "TEXT":
      return (
        <TextPropertiesComponent
          component={component}
          componentIndex={componentIndex}
        />
      );
    case "FIREBASEAUDIO":
      return (
        <FirebaseAudioPropertiesComponent
          component={component}
          componentIndex={componentIndex}
        />
      );
    case "FIREBASEIMAGE":
      return (
        <ImagePropertiesComponent
          component={component}
          componentIndex={componentIndex}
        />
      );
    default:
      break;
  }

  return <div />;
}
