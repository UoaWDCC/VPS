function addButton(currentScene, setCurrentScene) {
  const newButton = {
    type: "BUTTON",
    text: "Button",
    variant: "contained",
    colour: "white",
    nextScene: "",
    left: 50, // as percentage
    top: 50, // as percentage
    height: 6, // as percentage
    width: 8, // as percentage
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
    left: 50, // as percentage
    top: 50, // as percentage
    height: 10, // as percentage
    width: 20, // as percentage
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
  };

  const updatedComponents = currentScene.components;

  updatedComponents.push(newImage);

  setCurrentScene({
    ...currentScene,
    components: updatedComponents,
  });
}

export { addButton, addText, addImage };
