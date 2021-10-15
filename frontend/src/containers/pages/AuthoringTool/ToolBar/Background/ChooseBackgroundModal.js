import React, { useState, useContext } from "react";
import Button from "@material-ui/core/Button";
import ModalDialogue from "../../../../../components/ModalDialogue";
import { useGet } from "../../../../../hooks/crudHooks";
import styles from "../../../../../styling/ChooseBackgroundModal.module.scss";
import ImageListContainer from "../../../../../components/ImageListContainer";
import { addImage } from "../ToolBarActions";
import SceneContext from "../../../../../context/SceneContext";
import ToolbarContext from "../../../../../context/ToolbarContext";

/**
 * This component is a modal that displays the default images for users to select.
 * @component
 */
export default function ChooseBackgroundModal({ isShowing, hide }) {
  const { currentScene, setCurrentScene } = useContext(SceneContext);
  const [images, setImages] = useState();
  const { handleDropdownClose } = useContext(ToolbarContext);

  // eslint-disable-next-line no-unused-vars
  const [selectedImage, setSelectedImage] = useState();
  useGet("/api/image", setImages);

  function closeDialogues() {
    hide();
    handleDropdownClose();
  }

  function handleButtonClick() {
    closeDialogues();
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
      title="Choose Image"
      isShowing={isShowing}
      hide={closeDialogues}
      dialogueAction={saveButton}
    >
      <ImageListContainer data={images} onItemSelected={setSelectedImage} />
    </ModalDialogue>
  );
}
