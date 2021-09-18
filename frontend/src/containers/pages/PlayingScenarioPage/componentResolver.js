import React from "react";
import ButtonComponent from "../AuthoringTool/Components/ButtonComponent";
import TextComponent from "../AuthoringTool/Components/TextComponent";
import ImageComponent from "../AuthoringTool/Components/ImageComponent";

export default function componentResolver(component, id, onClick) {
  switch (component.type) {
    // ADD NEW COMPONENT TYPES HERE
    case "BUTTON":
      return (
        <ButtonComponent id={id} onClick={onClick} component={component} />
      );
    case "TEXT":
      return (
        <TextComponent
          id={id}
          onClick={() => {
            console.log("text clicked");
          }}
          component={component}
        />
      );
    case "IMAGE":
      return (
        <ImageComponent
          id={id}
          onClick={() => {
            console.log("image clicked");
          }}
          component={component}
        />
      );
    default:
      break;
  }

  return <div />;
}
