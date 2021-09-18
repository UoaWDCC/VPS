import React from "react";
import ButtonComponent from "../AuthoringTool/Components/ButtonComponent/ButtonComponent";
import TextComponent from "../AuthoringTool/Components/TextComponent";

export default function componentResolver(component, id, onClick) {
  switch (component.type) {
    // ADD NEW COMPONENT TYPES HERE
    case "BUTTON":
      return (
        <ButtonComponent id={id} onClick={onClick} component={component} />
      );
    case "TEXT":
      return <TextComponent id={id} onClick={onClick} component={component} />;
    default:
      break;
  }

  return <div />;
}
