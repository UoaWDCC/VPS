import { v4 } from "uuid";

/**
 * @param {object} currentScene
 * @param {function} setCurrentScene
 */
function addComponent(component, currentScene, setCurrentScene) {
  const updatedComponents = currentScene.components;

  updatedComponents.push(component);

  setCurrentScene({
    ...currentScene,
    components: updatedComponents,
  });
}

/**
 * function to be put into ToolBarData when button is added
 */
function addButton(currentScene, setCurrentScene) {
  const newButton = {
    type: "BUTTON",
    text: "Button",
    variant: "contained",
    colour: "white",
    nextScene: "",
    left: 0, // as percentage
    top: 0, // as percentage
    height: 6, // as percentage
    width: 20, // as percentage
    id: v4(),
  };

  addComponent(newButton, currentScene, setCurrentScene);
}

/**
 * function to be put into ToolBarData when text is added
 */
function addText(currentScene, setCurrentScene) {
  const newText = {
    type: "TEXT",
    text: "default text",
    border: true,
    fontSize: 16, // pt
    color: "black",
    textAlign: "left",
    left: 0, // as percentage
    top: 0, // as percentage
    height: 10, // as percentage
    width: 20, // as percentage
    id: v4(),
  };

  addComponent(newText, currentScene, setCurrentScene);
}

function addSpeechText(currentScene, setCurrentScene) {
  const newSpeechText = {
    type: "SPEECHTEXT",
    text: "default speech text",
    border: true,
    fontSize: 16, // pt
    color: "black",
    textAlign: "left",
    left: 0, // as percentage
    top: 0, // as percentage
    height: 10, // as percentage
    width: 20, // as percentage
    arrowLocation: "top",
    id: v4(),
  };

  addComponent(newSpeechText, currentScene, setCurrentScene);
}

/**
 * function to be put into ToolBarData when image is added
 * @param {object} image
 */
function addImage(currentScene, setCurrentScene, image) {
  const newImage = {
    type: "IMAGE",
    imageId: image._id,
    left: 0, // as percentage
    top: 0, // as percentage
    height: "auto", // as percentage
    width: "auto", // as percentage
    id: v4(),
  };

  addComponent(newImage, currentScene, setCurrentScene);
}

/**
 * function to be put into ToolBarData when firebase image is added
 * @param {object} fileObject
 * @param {string} url
 */
function addFirebaseImage(currentScene, setCurrentScene, fileObject, url) {
  const newImage = {
    type: "FIREBASEIMAGE",
    fileObject,
    url,
    left: 0, // as percentage
    top: 0, // as percentage
    height: "auto", // as percentage
    width: "auto", // as percentage
    id: v4(),
  };

  addComponent(newImage, currentScene, setCurrentScene);
}

/**
 * call this when user adds firebase audio
 *
 * @param {object} fileObject
 * @param {string} url
 */
function addFirebaseAudio(currentScene, setCurrentScene, fileObject, url) {
  const newAudio = {
    type: "FIREBASEAUDIO",
    name: fileObject.name,
    fileObject,
    url,
    loop: false,
    left: 0, // as percentage
    top: 0, // as percentage
    height: 10, // as percentage
    width: 5, // as percentage
    id: v4(),
  };

  addComponent(newAudio, currentScene, setCurrentScene);
}

export {
  addButton,
  addFirebaseAudio,
  addFirebaseImage,
  addImage,
  addSpeechText,
  addText,
};
