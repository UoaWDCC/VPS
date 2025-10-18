import SpeechTextComponent from "features/authoring/components/SpeechTextComponent";
import ButtonComponent from "../authoring/components/ButtonComponent";
import FirebaseImageComponent from "../authoring/components/FirebaseImageComponent";
import ImageComponent from "../authoring/components/ImageComponent";
import TextComponent from "../authoring/components/TextComponent";

// Components for playing only
import AudioComponent from "./components/AudioComponent";

/**
 * This function returns the appropriate React component for a scene component object when playing
 *
 * @example
 * {currentScene?.components?.map((component, index) =>
 *   componentResolver(component, index, selectElement)
 * )}
 */
export default function componentResolver(component, index, onClick) {
  const props = { key: component.id, id: index, onClick, component };

  switch (component.type) {
    // ADD NEW COMPONENT TYPES HERE
    case "BUTTON":
      return <ButtonComponent {...props} />;
    case "RESET_BUTTON":
      return <ButtonComponent {...props} />;
    case "SPEECHTEXT":
      return <SpeechTextComponent {...props} />;
    case "TEXT":
      return <TextComponent {...props} />;
    case "IMAGE":
      return <ImageComponent {...props} />;
    case "FIREBASEIMAGE":
      return <FirebaseImageComponent {...props} />;
    case "FIREBASEAUDIO":
      return <AudioComponent {...props} />;
    default:
      return <div />;
  }
}
