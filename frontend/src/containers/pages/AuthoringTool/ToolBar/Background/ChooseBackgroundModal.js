import React, { useState, useContext } from "react";
import Button from "@material-ui/core/Button";
import ModalDialogue from "../../../../../components/ModalDialogue";
import { useGet } from "../../../../../hooks/crudHooks";
import styles from "../../../../../styling/ChooseBackgroundModal.module.scss";
import ImageListContainer from "../../../../../components/ImageListContainer";
import addImage from "./addImage";
import SceneContext from "../../../../../context/SceneContext";

export default function ChooseBackgroundModal({ isShowing, hide }) {
  const { currentScene, setCurrentScene } = useContext(SceneContext);
  const [images, setImages] = useState();

  // eslint-disable-next-line no-unused-vars
  const [selectedImage, setSelectedImage] = useState();
  useGet("/api/image", setImages);

  function handleButtonClick() {
    hide();
    addImage(currentScene, setCurrentScene, selectedImage);
  }

  const saveButton = (
    <Button
      autoFocus
      onClick={handleButtonClick}
      className={styles.dialogueActionButton}
      disabled={!selectedImage}
    >
      Add image
    </Button>
  );

  return (
    <ModalDialogue
      title="Choose Background"
      isShowing={isShowing}
      hide={hide}
      dialogueAction={saveButton}
    >
      <ImageListContainer data={images} onItemSelected={setSelectedImage} />
    </ModalDialogue>
  );
}
