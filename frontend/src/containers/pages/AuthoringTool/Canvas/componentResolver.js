import React from "react";
import ButtonComponent from "../Components/ButtonComponent";
import TextComponent from "../Components/TextComponent";
import ImageComponent from "../Components/ImageComponent";

export default function componentResolver(component, id, onClick) {
  switch (component.type) {
    // ADD NEW COMPONENT TYPES HERE
    case "BUTTON":
      return (
        <ButtonComponent
          key={id}
          id={id}
          onClick={onClick}
          component={component}
        />
      );
    case "TEXT":
      return (
        <TextComponent
          key={id}
          id={id}
          onClick={onClick}
          component={component}
        />
      );
    case "IMAGE":
      return (
        <ImageComponent
          key={id}
          id={id}
          onClick={onClick}
          component={component}
        />
      );
    default:
      break;
  }

  return <div />;
}
