import ButtonComponent from "../components/ButtonComponent";
import FirebaseAudioComponent from "../components/FirebaseAudioComponent";
import FirebaseImageComponent from "../components/FirebaseImageComponent";
import ImageComponent from "../components/ImageComponent";
import SpeechTextComponent from "../components/SpeechTextComponent";
import TextComponent from "../components/TextComponent";

/**
 * This function returns the appropriate React component for a scene component object when editing
 *
 * @example
 * {currentScene?.components?.map((component, index) =>
 *   componentResolver(component, index, selectElement)
 * )}
 */
export default function componentResolver(component, index, onClick) {
  switch (component.type) {
    // ADD NEW COMPONENT TYPES HERE
    case "BUTTON":
      return (
        <ButtonComponent
          key={component.id}
          id={index}
          onClick={onClick}
          component={component}
        />
      );
    case "RESET_BUTTON":
      return (
        <ButtonComponent
          key={component.id}
          id={index}
          onClick={onClick}
          component={component}
        />
      );
    case "SPEECHTEXT":
      return (
        <SpeechTextComponent
          key={component.id}
          id={index}
          onClick={onClick}
          component={component}
        />
      );
    case "TEXT":
      return (
        <TextComponent
          key={component.id}
          id={index}
          onClick={onClick}
          component={component}
        />
      );
    case "IMAGE":
      return (
        <ImageComponent
          key={component.id}
          id={index}
          onClick={onClick}
          component={component}
        />
      );
    case "FIREBASEIMAGE":
      return (
        <FirebaseImageComponent
          key={component.id}
          id={index}
          onClick={onClick}
          component={component}
        />
      );
    case "FIREBASEAUDIO":
      return (
        <FirebaseAudioComponent
          key={component.id}
          id={index}
          onClick={onClick}
          component={component}
        />
      );
    default:
      break;
  }

  return <div />;
}
