import React from "react";
import ImageIcon from "@material-ui/icons/Image";
import TextFieldsIcon from "@material-ui/icons/TextFields";
import VolumeUpIcon from "@material-ui/icons/VolumeUp";
import CloudQueueIcon from "@material-ui/icons/CloudQueue";
import PublishIcon from "@material-ui/icons/Publish";
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
      console.log("audio clicked");
    },
  },
  {
    title: "Audio",
    icon: <VolumeUpIcon fontSize="medium" />,
    dropdown: [
      {
        title: "choose from bank",
        icon: <CloudQueueIcon fontSize="medium" />,
        onClick: () => {
          console.log("choose from bank");
        },
      },
      {
        title: "upload",
        icon: <PublishIcon fontSize="medium" />,
        onClick: () => {
          console.log("upload");
        },
      },
    ],
  },
];

export default toolBarData;
