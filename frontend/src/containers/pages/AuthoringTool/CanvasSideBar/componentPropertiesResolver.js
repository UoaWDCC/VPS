import React from "react";
import ButtonPropertiesComponent from "./ComponentProperties/ButtonPropertiesComponent";
import FirebaseAudioPropertiesComponent from "./ComponentProperties/FirebaseAudioPropertiesComponent";
import TextPropertiesComponent from "./ComponentProperties/TextPropertiesComponent";

export default function componentPropertiesResolver(component, componentIndex) {
  switch (component?.type) {
    // ADD NEW COMPONENT TYPES HERE
    case "BUTTON":
      return (
        <ButtonPropertiesComponent
          component={component}
          componentIndex={componentIndex}
        />
      );
    case "TEXT":
      return (
        <TextPropertiesComponent
          component={component}
          componentIndex={componentIndex}
        />
      );
    case "FIREBASEAUDIO":
      return (
        <FirebaseAudioPropertiesComponent
          component={component}
          componentIndex={componentIndex}
        />
      );
    default:
      break;
  }

  return <div />;
}
