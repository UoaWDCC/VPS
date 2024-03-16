/* eslint-disable no-param-reassign */
import Image from "material-ui-image";
import { imageContainerStyles, imageStyles } from "./components.styles";

/**
 * This component represents a firebase image scene component
 * @component
 * @example
 * <FirebaseImageComponent
 *    id={index}
 *    onClick={onClick}
 *    component={component}
 * />
 */
export default function FirebaseImageComponent({ id, onClick, component }) {
  const setSize = () => {
    // The below is used to recalculate the height and width of an image. Especially when it is intiallised using auto
    const imageElement = document.getElementById(id);
    const canvas = document.getElementById("canvas")?.getBoundingClientRect();
    if (canvas && component && imageElement) {
      component.width = (imageElement.offsetWidth / canvas.width) * 100;
      component.height = (imageElement.offsetHeight / canvas.height) * 100;
    }
  };

  return (
    <Image
      id={id}
      src={component.url}
      imageStyle={imageStyles(component)}
      style={imageContainerStyles()}
      onClick={onClick}
      onLoad={setSize}
    />
  );
}
