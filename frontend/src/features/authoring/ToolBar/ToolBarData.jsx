import ButtonIcon from "@material-ui/icons/AddCircle";
import ChatBubbleIcon from "@material-ui/icons/ChatBubble";
import ImageIcon from "@material-ui/icons/Image";
import TextFieldsIcon from "@material-ui/icons/TextFields";
import VolumeUpIcon from "@material-ui/icons/VolumeUp";
import UploadAudio from "./UploadAudio";
import ChooseBackgroundSubMenu from "./Background/ChooseBackgroundSubMenu";
import UploadImage from "./Background/UploadImage";
import {
  addButton,
  addResetButton,
  addSpeechText,
  addText,
} from "./ToolBarActions";
import OpenStateVariableMenu from "./OpenStateVariableMenu";

/**
 * This file contains the data for the add component icons to be added into the ToolBar
 */
const toolBarData = [
  {
    title: "Add Image",
    icon: <ImageIcon fontSize="medium" />,
    dropdown: [
      {
        component: <ChooseBackgroundSubMenu />,
      },
      {
        component: <UploadImage />,
      },
    ],
  },
  {
    title: "Add Text",
    icon: <TextFieldsIcon fontSize="medium" />,
    onClick: addText,
  },
  {
    title: "Add Button",
    icon: <ButtonIcon fontSize="medium" />,
    onClick: addButton,
  },
  {
    title: "Add Reset",
    icon: <ButtonIcon fontSize="medium" />,
    onClick: addResetButton,
  },
  {
    title: "Add Audio",
    icon: <VolumeUpIcon fontSize="medium" />,
    dropdown: [
      {
        component: <UploadAudio />,
      },
    ],
  },
  {
    title: "Add Speech text",
    icon: <ChatBubbleIcon fontSize="medium" />,
    onClick: addSpeechText,
  },
  {
    title: "State Variables",
    icon: <TextFieldsIcon fontSize="medium" />,
    dropdown: [
      {
        component: <OpenStateVariableMenu />,
      },
    ],
  }
];

export default toolBarData;
