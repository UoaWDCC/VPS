/* eslint-disable no-param-reassign */
import React from "react";
import ButtonComponent from "../Components/ButtonComponent";
import TextComponent from "../Components/TextComponent";
import ImageComponent from "../Components/ImageComponent";
import FirebaseImageComponent from "../Components/FirebaseImageComponent";
import FirebaseAudioComponent from "../Components/FirebaseAudioComponent";

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
        <FirebaseAudioComponent
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
