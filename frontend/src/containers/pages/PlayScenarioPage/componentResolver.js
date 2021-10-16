/* eslint-disable no-param-reassign */
import React from "react";

// Shared components from authoring canvas
import ButtonComponent from "../AuthoringTool/Components/ButtonComponent";
import TextComponent from "../AuthoringTool/Components/TextComponent";
import ImageComponent from "../AuthoringTool/Components/ImageComponent";
import FirebaseImageComponent from "../AuthoringTool/Components/FirebaseImageComponent";

// Components for playing only
import AudioComponent from "./Components/AudioComponent";

/**
 * This function returns the appropriate React component for a scene component object when playing
 *
 * @example
 * {currentScene?.components?.map((component, index) =>
 *   componentResolver(component, index, selectElement)
 * )}
 */
export default function componentResolver(component, index, onClick) {
  switch (component.type) {
    // ADD NEW COMPONENT TYPES HERE
    case "BUTTON":
      return (
        <ButtonComponent
          key={component.id}
          id={index}
          onClick={onClick}
          component={component}
        />
      );
    case "TEXT":
      return (
        <TextComponent
          key={component.id}
          id={index}
          onClick={onClick}
          component={component}
        />
      );
    case "IMAGE":
      return (
        <ImageComponent
          key={component.id}
          id={index}
          onClick={onClick}
          component={component}
        />
      );
    case "FIREBASEIMAGE":
      return (
        <FirebaseImageComponent
          key={component.id}
          id={index}
          onClick={onClick}
          component={component}
        />
      );
    case "FIREBASEAUDIO":
      return (
        <AudioComponent
          key={component.id}
          id={index}
          onClick={onClick}
          component={component}
        />
      );
    default:
      break;
  }

  return <div />;
}
