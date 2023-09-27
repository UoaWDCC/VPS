import React from "react";
import ImageIcon from "@material-ui/icons/Image";
import TextFieldsIcon from "@material-ui/icons/TextFields";
import ButtonIcon from "@material-ui/icons/AddCircle";
import VolumeUpIcon from "@material-ui/icons/VolumeUp";
import ChatBubbleIcon from "@material-ui/icons/ChatBubble";
import ChooseBackgroundSubMenu from "./Background/ChooseBackgroundSubMenu";
import { addButton, addText, addSpeechText } from "./ToolBarActions";
import UploadImage from "./Background/UploadImage";
import UploadAudio from "./Audio/UploadAudio";
import PlayersListSubMenu from "./Background/PlayersListSubMenu";

/**
 * This file contains the data for the add component icons to be added into the ToolBar
 */
const toolBarData = [
  {
    title: "Image",
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
    title: "Text",
    icon: <TextFieldsIcon fontSize="medium" />,
    onClick: addText,
  },
  {
    title: "Button",
    icon: <ButtonIcon fontSize="medium" />,
    onClick: addButton,
  },
  {
    title: "Audio",
    icon: <VolumeUpIcon fontSize="medium" />,
    dropdown: [
      {
        component: <UploadAudio />,
      },
    ],
  },
  {
    title: "Speech text",
    icon: <ChatBubbleIcon fontSize="medium" />,
    onClick: addSpeechText,
  },
  {
    title: "Apply Tags",
    icon: <ImageIcon fontSize="medium" />,
    dropdown: [
      {
        component: <PlayersListSubMenu />,
      },
    ],
  },
];

export default toolBarData;
