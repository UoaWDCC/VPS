import React from "react";
import ButtonComponent from "./ButtonComponent/ButtonComponent";

export default function componentResolver(component, id, selectElement) {
  switch (component.type) {
    // ADD NEW COMPONENT TYPES HERE
    case "BUTTON":
      return (
        <ButtonComponent
          id={id}
          selectElement={selectElement}
          component={component}
        />
      );
    default:
      break;
  }

  return <div />;
}
