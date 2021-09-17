import React, { useState } from "react";
import Image from "material-ui-image";
import { useGet } from "../../../../../hooks/crudHooks";
import { imageStyles, imageContainerStyles } from "../components.styles";

export default function ImageComponent({ id, selectElement, component }) {
  const [image, setImage] = useState();
  useGet(`/api/image/${component.imageId}`, setImage);

  return (
    <Image
      id={id}
      src={image ? image.url : ""}
      imageStyle={imageStyles(component)}
      style={imageContainerStyles(component)}
      onClick={selectElement}
    />
  );
}
