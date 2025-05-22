import { MenuItem, MenuList, Paper } from "@material-ui/core";
import RightContextMenu from "../../../components/ContextMenu/RightContextMenu";
import ButtonComponent from "../components/ButtonComponent";
import FirebaseAudioComponent from "../components/FirebaseAudioComponent";
import FirebaseImageComponent from "../components/FirebaseImageComponent";
import ImageComponent from "../components/ImageComponent";
import SpeechTextComponent from "../components/SpeechTextComponent";
import TextComponent from "../components/TextComponent";
import SceneContext from "../../../context/SceneContext";
import { handleSendToBack } from "../CanvasSideBar/ComponentProperties/ZAxis";
import { useContext } from "react";
import { handle } from "../../../components/ContextMenu/portal";




const SceneMenu = ({ updateComponentProperty, currentScene, component }) => {
  return (
    <Paper>
      <MenuList>
        <MenuItem>Duplicate</MenuItem>
        <MenuItem onClick={() => handle(handleSendToBack, { currentScene, component, updateComponentProperty })}>Send To Back</MenuItem>
        <MenuItem>Delete</MenuItem>
      </MenuList>
    </Paper>
  );
};

/**
 * This function returns the appropriate React component for a scene component object when editing
 *
 * @example
 * {currentScene?.components?.map((component, index) =>
 *   componentResolver(component, index, selectElement)
 * )}
 */
export default function componentResolver(component, index, onClick) {
  const { currentScene, updateComponentProperty } = useContext(SceneContext);

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
        <RightContextMenu menu={SceneMenu({ updateComponentProperty, currentScene, component })}>
          <TextComponent
            key={component.id}
            id={index}
            onClick={onClick}
            component={component}
          />
        </RightContextMenu>
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
