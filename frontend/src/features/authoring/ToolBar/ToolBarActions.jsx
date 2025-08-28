import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { v4 as uuidv4 } from "uuid";
import { getFirestore, collection, addDoc, setDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { api, handleGeneric } from "../../../util/api.js";

const storage = getStorage();
const db = getFirestore();

/**
 * @param {object} currentScene
 * @param {function} setCurrentScene
 */
function addComponent(component, currentScene, setCurrentScene) {
  // avoid mutating currentScene.components directly
  const updatedComponents = [...(currentScene.components || []), component];

  console.log(component);

  setCurrentScene({
    ...currentScene,
    components: updatedComponents,
  });
}

/**
 * function to be put into ToolBarData when button is added
 */
function addButton(currentScene, setCurrentScene) {
  const newButton = {
    type: "BUTTON",
    text: "Button",
    variant: "contained",
    colour: "white",
    nextScene: "",
    left: 0, // as percentage
    top: 0, // as percentage
    height: 6, // as percentage
    width: 20, // as percentage
    id: uuidv4(),
    zPosition: 0,
    flagAdditions: {},
    flagDeletions: {},
  };

  addComponent(newButton, currentScene, setCurrentScene);
}

/**
 * function to be put into ToolBarData when button is added
 */
function addResetButton(currentScene, setCurrentScene) {
  const newResetButton = {
    type: "RESET_BUTTON",
    text: "Reset",
    variant: "contained",
    colour: "red",
    nextScene: "",
    left: 0, // as percentage
    top: 0, // as percentage
    height: 6, // as percentage
    width: 20, // as percentage
    id: uuidv4(),
    zPosition: 0,
  };

  addComponent(newResetButton, currentScene, setCurrentScene);
}

/**
 * function to be put into ToolBarData when text is added
 */
function addText(currentScene, setCurrentScene) {
  const newText = {
    type: "TEXT",
    text: "default text",
    border: true,
    fontSize: 16, // pt
    color: "black",
    textAlign: "left",
    left: 0, // as percentage
    top: 0, // as percentage
    height: 10, // as percentage
    width: 20, // as percentage
    id: uuidv4(),
    zPosition: 0,
  };

  addComponent(newText, currentScene, setCurrentScene);
}

function addSpeechText(currentScene, setCurrentScene) {
  const newSpeechText = {
    type: "SPEECHTEXT",
    text: "default speech text",
    border: true,
    fontSize: 16, // pt
    color: "black",
    textAlign: "left",
    left: 0, // as percentage
    top: 0, // as percentage
    height: 30, // as percentage
    width: 20, // as percentage
    arrowLocation: "bottom",
    id: uuidv4(),
    zPosition: 0,
  };

  addComponent(newSpeechText, currentScene, setCurrentScene);
}

/**
 * function to be put into ToolBarData when image is added
 * @param {object} image
 */
function addImage(currentScene, setCurrentScene, image) {
  if (!image || (!image.id && !image._id)) {
    console.error("Invalid image object passed to addImage:", image);
    return;
  }

  const newImage = {
    type: "IMAGE",
    imageId: image.id || image._id,
    left: 0,
    top: 0,
    height: "auto",
    width: "auto",
    id: uuidv4(),
    zPosition: 0,
  };

  addComponent(newImage, currentScene, setCurrentScene);
}

/**
 * Uploads an image to Firebase, saves the metadata to Firestore,
 * notifies the backend, and adds the image to the current scene.
 *
 * @param {object} currentScene
 * @param {function} setCurrentScene
 * @param {File} fileObject
 */
export async function addFirebaseImage(
  currentScene,
  setCurrentScene,
  fileObject
) {
  try {
    const auth = getAuth(); // 🔑 get auth
    const user = auth.currentUser; // 🔑 get the logged-in user
    if (!user) {
      console.error("User not logged in");
      return;
    }

    // Upload image to Firebase Storage
    const storageRef = ref(storage, `uploads/${fileObject.name}_${Date.now()}`);
    const snapshot = await uploadBytes(storageRef, fileObject);
    const downloadURL = await getDownloadURL(snapshot.ref);

    // Save image URL and metadata in Firestore
    const uploadedAt = new Date().toISOString();
    const docRef = await addDoc(collection(db, "uploadedImages"), {
      url: downloadURL,
      uploadedAt,
      fileName: fileObject.name,
      uid: user.uid,
    });
    await setDoc(docRef, { id: docRef.id }, { merge: true });
    console.log("Image metadata saved with ID:", docRef.id);
    console.log("Image uploaded at:", downloadURL);

    // Notify your backend using centralized axios client (auth handled)
    try {
      await api.post(user, "/api/image", {
        images: [
          {
            id: docRef.id,
            url: downloadURL,
            fileName: fileObject.name,
            uploadedAt,
          },
        ],
      });
    } catch (err) {
      // toast + log via shared handler
      handleGeneric(err);
    }

    // Add image to scene
    const newImage = {
      type: "FIREBASEIMAGE",
      fileObject,
      url: downloadURL, // permanent URL
      left: 0, // as percentage
      top: 0, // as percentage
      height: "auto",
      width: "auto",
      id: uuidv4(),
      zPosition: 0,
    };

    addComponent(newImage, currentScene, setCurrentScene);
  } catch (error) {
    console.error("Error uploading image:", error);
  }
}

/**
 * call this when user adds firebase audio
 *
 * @param {object} fileObject
 * @param {string} url
 */
function addFirebaseAudio(currentScene, setCurrentScene, fileObject, url) {
  const newAudio = {
    type: "FIREBASEAUDIO",
    name: fileObject.name,
    fileObject,
    url,
    loop: false,
    left: 0, // as percentage
    top: 0, // as percentage
    height: 10, // as percentage
    width: 5, // as percentage
    id: uuidv4(),
    zPosition: 0,
  };

  addComponent(newAudio, currentScene, setCurrentScene);
}

export {
  addButton,
  addResetButton,
  addFirebaseAudio,
  addImage,
  addSpeechText,
  addText,
};
