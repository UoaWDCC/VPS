import React, { useState } from "react";
import Button from "@material-ui/core/Button";
import ModalDialogue from "../../../../../components/ModalDialogue";
import { useGet } from "../../../../../hooks/crudHooks";
import styles from "../../../../../styling/ChooseBackgroundModal.module.scss";
import ImageListContainer from "../../../../../components/ImageListContainer";

export default function ChooseBackgroundModal({ isShowing, hide }) {
  const [images, setImages] = useState();
  const [selectedImage, setSelectedImage] = useState();
  const saveButton = (
    <Button autoFocus onClick={hide} className={styles.dialogueActionButton}>
      Add image
    </Button>
  );

  useGet("/api/image", setImages);

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
