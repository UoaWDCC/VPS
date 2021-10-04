/* eslint-disable no-param-reassign */
import React, { useEffect } from "react";
import Image from "material-ui-image";
import { imageStyles, imageContainerStyles } from "./components.styles";

export default function FirebaseImageComponent({ id, onClick, component }) {
  useEffect(() => {
    // The below is used to recalculate the height and width of an image. Especially when it is intiallised using auto
    const imageElement = document.getElementById(id);
    const canvas = document.getElementById("canvas")?.getBoundingClientRect();
    if (canvas && component && imageElement) {
      component.width = (imageElement.offsetWidth / canvas.width) * 100;
      component.height = (imageElement.offsetHeight / canvas.height) * 100;
    }
  }, []);

  return (
    <Image
      id={id}
      src={component.fileObject}
      imageStyle={imageStyles(component)}
      style={imageContainerStyles()}
      onClick={onClick}
    />
  );
}
