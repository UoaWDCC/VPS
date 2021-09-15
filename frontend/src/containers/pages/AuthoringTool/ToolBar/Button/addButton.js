function addButton(currentScene, setCurrentScene) {
  const newButton = {
    type: "BUTTON",
    text: "Button",
    variant: "contained",
    colour: "white",
    nextScene: null,
    left: "50%",
    top: "50%",
    height: "40px",
    width: "50px",
  };

  const updatedComponents = currentScene.components;

  updatedComponents.push(newButton);

  setCurrentScene({
    ...currentScene,
    components: updatedComponents,
  });
}

export default addButton;
