import React from "react";
import ImageIcon from "@material-ui/icons/Image";
import TextFieldsIcon from "@material-ui/icons/TextFields";
import VolumeUpIcon from "@material-ui/icons/VolumeUp";
import CloudQueueIcon from "@material-ui/icons/CloudQueue";
import PublishIcon from "@material-ui/icons/Publish";

const toolBarData = [
  {
    title: "Background Image",
    icon: <ImageIcon fontSize="medium" />,
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
  {
    title: "Text",
    icon: <TextFieldsIcon fontSize="medium" />,
    dropdown: [],
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
