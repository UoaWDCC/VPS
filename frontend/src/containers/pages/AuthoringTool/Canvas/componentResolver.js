import React from "react";
import BoxComponent from "./BoxComponent/BoxComponent";

export default function componentResolver(component, id, selectElement) {
  switch (component.type) {
    // ADD NEW COMPONENT TYPES HERE
    case "TEST":
      break;
    default:
      return <BoxComponent id={id} selectElement={selectElement} key={id} />;
  }

  return <div />;
}
