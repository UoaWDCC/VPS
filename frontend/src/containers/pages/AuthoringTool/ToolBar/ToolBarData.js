import React from "react";
import ImageIcon from "@material-ui/icons/Image";
import TextFieldsIcon from "@material-ui/icons/TextFields";
import ButtonIcon from "@material-ui/icons/AddCircle";
import VolumeUpIcon from "@material-ui/icons/VolumeUp";
import ChooseBackgroundSubMenu from "./Background/ChooseBackgroundSubMenu";
import { addButton, addText } from "./ToolBarActions";

const toolBarData = [
  {
    title: "Background Image",
    icon: <ImageIcon fontSize="medium" />,
    dropdown: [
      {
        component: <ChooseBackgroundSubMenu />,
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
    onClick: () => {
      console.log("audio clicked");
    },
  },
];

export default toolBarData;
