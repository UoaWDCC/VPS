import { useEffect, useContext, useState } from "react";
import Button from "@material-ui/core/Button";
import ImageListContainer from "components/ListContainer/ImageListContainer";
import ModalDialogue from "components/ModalDialogue";
import SceneContext from "context/SceneContext";
import ToolbarContext from "context/ToolbarContext";
import styles from "./ChooseBackgroundModal.module.scss";
import { addImage } from "../ToolBarActions";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../../firebase/firebase.js";
import { getAuth } from "firebase/auth";
import { query, where } from "firebase/firestore";


/**
 * This component is a modal that displays the default images for users to select.
 * @component
 */
export default function ChooseBackgroundModal({ isShowing, hide }) {
  const { currentScene, setCurrentScene } = useContext(SceneContext);
  const { handleDropdownClose } = useContext(ToolbarContext);

  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    const fetchImages = async () => {
      
      try {
        const auth = getAuth();
        const user = auth.currentUser;

        if (!user) {
          console.error("No user logged in");
          return;
        }

        console.log("User ID:", user.uid);

        const q = query(
          collection(db, "uploadedImages"),
          where("uid", "==", user.uid) // 🔑 filter by user ID
        );

        const snapshot = await getDocs(q);
        const result = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setImages(result);
      } catch (err) {
        console.error("Failed to fetch images:", err);
      }
    };

    if (isShowing) {
      fetchImages();
    }
  }, [isShowing]);

  function closeDialogues() {
    hide();
    handleDropdownClose();
  }

  function handleButtonClick() {
    if (!selectedImage?.id) {
      console.error("No image selected or missing ID");
      return;
    }
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
    <ImageListContainer
      data={images}
      selectedId={selectedImage?.id}
      onItemSelected={setSelectedImage}
    />

    </ModalDialogue>
  );
}
