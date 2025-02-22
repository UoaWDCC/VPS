import Button from "@material-ui/core/Button";
import { useContext, useState } from "react";
import ImageListContainer from "components/ListContainer/ImageListContainer";
import ModalDialogue from "components/ModalDialogue";
import SceneContext from "context/SceneContext";
import ToolbarContext from "context/ToolbarContext";
import { useGet } from "hooks/crudHooks";
import styles from "./ChooseBackgroundModal.module.scss";
import { addImage } from "../ToolBarActions";

/**
 * This component is a modal that displays the default images for users to select.
 * @component
 */
export default function ChooseBackgroundModal({ isShowing, hide }) {
  const { currentScene, setCurrentScene } = useContext(SceneContext);
  const [images, setImages] = useState();
  const { handleDropdownClose } = useContext(ToolbarContext);

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
