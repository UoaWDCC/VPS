import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { v4 as uuidv4 } from "uuid";
import { getFirestore, collection, addDoc, setDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { api, handleGeneric } from "../../../util/api.js";
import { defaults } from "../scene/operations/component.js";
import { add } from "../scene/operations/modifiers.js";

const storage = getStorage();
const db = getFirestore();

/**
 * Uploads an image to Firebase, saves the metadata to Firestore,
 * notifies the backend, and adds the image to the current scene.
 *
 * @param {File} fileObject
 */
export async function addFirebaseImage(fileObject) {
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

    const newImage = structuredClone(defaults.image);
    newImage.href = downloadURL;
    add(newImage);
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
// TODO: integrate this back in
//
// export function addFirebaseAudio(
//   currentScene,
//   setCurrentScene,
//   fileObject,
//   url
// ) {
//   const newAudio = {
//     type: "FIREBASEAUDIO",
//     name: fileObject.name,
//     fileObject,
//     url,
//     loop: false,
//     left: 0, // as percentage
//     top: 0, // as percentage
//     height: 10, // as percentage
//     width: 5, // as percentage
//     id: uuidv4(),
//     zPosition: 0,
//   };
//
//   addComponent(newAudio, currentScene, setCurrentScene);
// }
