import React, { useState } from "react";
import Image from "material-ui-image";
import { useGet } from "../../../../../hooks/crudHooks";

export default function ImageComponent({ id, selectElement, component }) {
  const [image, setImage] = useState();
  useGet(`/api/image/${component.imageId}`, setImage);

  return (
    <Image
      id={id}
      src={image ? image.url : ""}
      imageStyle={{
        maxHeight: "100%",
        maxWidth: "100%",
        width:
          component.width === "auto" ? component.width : `${component.width}%`,
        height:
          component.height === "auto"
            ? component.height
            : `${component.height}%`,
      }}
      style={{
        display: "contents",
      }}
      onClick={selectElement}
    />
  );
}
