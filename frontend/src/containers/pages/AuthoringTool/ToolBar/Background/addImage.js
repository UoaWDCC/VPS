async function addImage(currentScene, setCurrentScene, image) {
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

export default addImage;
