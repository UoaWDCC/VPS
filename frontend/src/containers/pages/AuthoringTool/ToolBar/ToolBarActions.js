import { v4 } from "uuid";

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

  const updatedComponents = currentScene.components;

  updatedComponents.push(newButton);

  setCurrentScene({
    ...currentScene,
    components: updatedComponents,
  });
}

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

  const updatedComponents = currentScene.components;

  updatedComponents.push(newText);

  setCurrentScene({
    ...currentScene,
    components: updatedComponents,
  });
}

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

  const updatedComponents = currentScene.components;

  updatedComponents.push(newImage);

  setCurrentScene({
    ...currentScene,
    components: updatedComponents,
  });
}

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

  const updatedComponents = currentScene.components;

  updatedComponents.push(newImage);

  setCurrentScene({
    ...currentScene,
    components: updatedComponents,
  });
}

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
    width: "auto", // icon ratio is fixed
    id: v4(),
  };

  const updatedComponents = currentScene.components;

  updatedComponents.push(newAudio);

  setCurrentScene({
    ...currentScene,
    components: updatedComponents,
  });
}

export { addButton, addText, addImage, addFirebaseImage, addFirebaseAudio };
