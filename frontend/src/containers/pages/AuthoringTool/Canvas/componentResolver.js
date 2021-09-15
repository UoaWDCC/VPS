import React from "react";
import ButtonComponent from "./ButtonComponent/ButtonComponent";
import TestButtonComponent from "./TestButtonComponent/TestButtonComponent";

export default function componentResolver(component, id, selectElement) {
  switch (component.type) {
    // ADD NEW COMPONENT TYPES HERE
    case "TEST":
      break;
    case "BUTTON":
      return (
        <ButtonComponent
          id={id}
          selectElement={selectElement}
          component={component}
        />
      );
    default:
      return (
        <TestButtonComponent id={id} selectElement={selectElement} key={id} />
      );
  }

  return <div />;
}
