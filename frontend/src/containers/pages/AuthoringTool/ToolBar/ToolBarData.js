import React from "react";
import ImageIcon from "@material-ui/icons/Image";
import TextFieldsIcon from "@material-ui/icons/TextFields";
import VolumeUpIcon from "@material-ui/icons/VolumeUp";
import ChooseBackgroundSubMenu from "./Background/ChooseBackgroundSubMenu";

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
    onClick: () => {
      console.log("text clicked");
    },
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
