import React from "react";
import Button from "@material-ui/core/Button";
import Typography from "@material-ui/core/Typography";
import ModalDialogue from "../../../../../components/ModalDialogue";
import styles from "../../../../../styling/ChooseBackgroundModal.module.scss";

export default function ChooseBackgroundModal({ isShowing, hide }) {
  const saveButton = (
    <Button autoFocus onClick={hide} className={styles.dialogueActionButton}>
      Save changes
    </Button>
  );
  return (
    <ModalDialogue
      title="Choose Background"
      isShowing={isShowing}
      hide={hide}
      dialogueAction={saveButton}
    >
      <Typography gutterBottom>
        Cras mattis consectetur purus sit amet fermentum. Cras justo odio,
        dapibus ac facilisis in, egestas eget quam. Morbi leo risus, porta ac
        consectetur ac, vestibulum at eros.
      </Typography>
      <Typography gutterBottom>
        Praesent commodo cursus magna, vel scelerisque nisl consectetur et.
        Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor.
      </Typography>
      <Typography gutterBottom>
        Aenean lacinia bibendum nulla sed consectetur. Praesent commodo cursus
        magna, vel scelerisque nisl consectetur et. Donec sed odio dui. Donec
        ullamcorper nulla non metus auctor fringilla.
      </Typography>
    </ModalDialogue>
  );
}
