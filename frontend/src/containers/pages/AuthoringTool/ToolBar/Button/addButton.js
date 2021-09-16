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

export default addButton;
