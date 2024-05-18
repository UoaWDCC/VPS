import ButtonPropertiesComponent from "./ComponentProperties/ButtonPropertiesComponent";
import FirebaseAudioPropertiesComponent from "./ComponentProperties/FirebaseAudioPropertiesComponent";
import ImagePropertiesComponent from "./ComponentProperties/ImagePropertiesComponent";
import SpeechTextPropertiesComponent from "./ComponentProperties/SpeechTextPropertiesComponent";
import TextPropertiesComponent from "./ComponentProperties/TextPropertiesComponent";
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
