import React from "react";
import ButtonComponent from "../Components/ButtonComponent/ButtonComponent";
import TextComponent from "../Components/TextComponent";

export default function componentResolver(component, id, selectElement) {
  switch (component.type) {
    // ADD NEW COMPONENT TYPES HERE
    case "BUTTON":
      return (
        <ButtonComponent
          id={id}
          onClick={selectElement}
          component={component}
        />
      );
    case "TEXT":
      return (
        <TextComponent id={id} onClick={selectElement} component={component} />
      );
    default:
      break;
  }

  return <div />;
}
