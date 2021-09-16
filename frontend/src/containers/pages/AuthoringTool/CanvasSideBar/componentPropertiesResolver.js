import React from "react";
import ButtonPropertiesComponent from "./ButtonPropertiesComponent/ButtonPropertiesComponent";

export default function componentPropertiesResolver(component, componentIndex) {
  switch (component.type) {
    // ADD NEW COMPONENT TYPES HERE
    case "BUTTON":
      return (
        <ButtonPropertiesComponent
          component={component}
          componentIndex={componentIndex}
        />
      );
    default:
      break;
  }

  return <div />;
}
