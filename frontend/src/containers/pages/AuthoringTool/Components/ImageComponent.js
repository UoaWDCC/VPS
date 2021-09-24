/* eslint-disable no-param-reassign */
import React, { useEffect, useState } from "react";
import Image from "material-ui-image";
import { useGet } from "../../../../hooks/crudHooks";
import { imageStyles, imageContainerStyles } from "./components.styles";

export default function ImageComponent({ id, onClick, component }) {
  const [image, setImage] = useState();
  useGet(`/api/image/${component.imageId}`, setImage, false);

  useEffect(() => {
    // The below is used to recalculate the height and width of an image. Especially when it is intiallised using auto
    const imageElement = document.getElementById(id);
    const canvas = document.getElementById("canvas")?.getBoundingClientRect();
    if (canvas && component && imageElement) {
      component.width = (imageElement.offsetWidth / canvas.width) * 100;
      component.height = (imageElement.offsetHeight / canvas.height) * 100;
    }
  }, [image]);

  return (
    <Image
      id={id}
      src={image ? image.url : ""}
      imageStyle={imageStyles(component)}
      style={imageContainerStyles()}
      onClick={onClick}
    />
  );
}
