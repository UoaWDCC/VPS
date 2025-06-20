import { MenuItem, MenuList, Paper } from "@material-ui/core";
import RightContextMenu from "../../../components/ContextMenu/RightContextMenu";
import ButtonComponent from "../components/ButtonComponent";
import FirebaseAudioComponent from "../components/FirebaseAudioComponent";
import FirebaseImageComponent from "../components/FirebaseImageComponent";
import ImageComponent from "../components/ImageComponent";
import SpeechTextComponent from "../components/SpeechTextComponent";
import TextComponent from "../components/TextComponent";
import {
  handleSendToBack,
  handleBringToFront,
  handleMoveBackward,
  handleMoveForward,
} from "../CanvasSideBar/ComponentProperties/ZAxis";
import { handle } from "../../../components/ContextMenu/portal";

const SceneMenu = ({
  updateComponentProperty,
  currentScene,
  component,
  componentIndex,
}) => {
  const handleSendToBackClick = () => {
    handleSendToBack({
      currentScene,
      component,
      updateComponentProperty: (_, property, value) =>
        updateComponentProperty(componentIndex, property, value),
    });
  };

  const handleBringToFrontClick = () => {
    handleBringToFront({
      currentScene,
      component,
      updateComponentProperty: (_, property, value) =>
        updateComponentProperty(componentIndex, property, value),
    });
  };

  const handleMoveBackwardClick = () => {
    handleMoveBackward({
      component,
      updateComponentProperty: (_, property, value) =>
        updateComponentProperty(componentIndex, property, value),
    });
  };

  const handleMoveForwardClick = () => {
    handleMoveForward({
      component,
      updateComponentProperty: (_, property, value) =>
        updateComponentProperty(componentIndex, property, value),
    });
  };

  return (
    <Paper>
      <MenuList>
        <MenuItem>Duplicate</MenuItem>
        <MenuItem onClick={handle(handleSendToBackClick)}>
          Send To Back
        </MenuItem>
        <MenuItem onClick={handle(handleBringToFrontClick)}>
          Bring To Front
        </MenuItem>
        <MenuItem onClick={handle(handleMoveBackwardClick)}>
          Move Backward
        </MenuItem>
        <MenuItem onClick={handle(handleMoveForwardClick)}>
          Move Forward
        </MenuItem>
        <MenuItem>Delete</MenuItem>
      </MenuList>
    </Paper>
  );
};

const ComponentWrapper = ({
  component,
  index,
  onClick,
  currentScene,
  updateComponentProperty,
}) => {
  const menu = (
    <SceneMenu
      updateComponentProperty={updateComponentProperty}
      currentScene={currentScene}
      component={component}
      componentIndex={index}
    />
  );

  const renderComponent = () => {
    switch (component.type) {
      case "BUTTON":
      case "RESET_BUTTON":
        return (
          <ButtonComponent id={index} onClick={onClick} component={component} />
        );
      case "SPEECHTEXT":
        return (
          <SpeechTextComponent
            id={index}
            onClick={onClick}
            component={component}
          />
        );
      case "TEXT":
        return (
          <TextComponent id={index} onClick={onClick} component={component} />
        );
      case "IMAGE":
        return (
          <ImageComponent id={index} onClick={onClick} component={component} />
        );
      case "FIREBASEIMAGE":
        return (
          <FirebaseImageComponent
            id={index}
            onClick={onClick}
            component={component}
          />
        );
      case "FIREBASEAUDIO":
        return (
          <FirebaseAudioComponent
            id={index}
            onClick={onClick}
            component={component}
          />
        );
      default:
        return <div />;
    }
  };

  return (
    <RightContextMenu key={component.id} menu={menu}>
      {renderComponent()}
    </RightContextMenu>
  );
};

export default ComponentWrapper;
