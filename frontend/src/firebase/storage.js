import {
  ref,
  uploadBytesResumable,
  updateMetadata,
  getDownloadURL,
} from "firebase/storage";
import { v4 } from "uuid";
import { storage } from "./firebase";

/**
 * Method to upload file to browser storage
 * This creates a temporary url of the file uploaded
 * This file will only get uploaded to Firebase once the scene is saved
 * @param {file} file
 * @param {string} scenarioId
 * @param {string} sceneId
 * @returns
 */
const uploadFile = async (file, scenarioId, sceneId) => {
  const fileUUID = v4();
  const storageRef = ref(storage, `${scenarioId}/${sceneId}/${fileUUID}`); // Create a storage reference
  const uploadTask = uploadBytesResumable(storageRef, file); // Start the upload

  // Return a promise that resolves with the download URL
  return new Promise((resolve, reject) => {
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        // Handle upload progress
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log(`Upload is ${progress}% done`);
        switch (snapshot.state) {
          case "paused":
            console.log("Upload is paused");
            break;
          case "running":
            console.log("Upload is running");
            break;
          default:
            break;
        }
      },
      (error) => {
        // Handle errors
        console.log("Error in uploading file:", error);
        reject(error);
      },
      async () => {
        try {
          // Get the download URL after the upload is complete
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          console.log("File available at", downloadURL);

          // Update metadata if needed
          const metaData = {
            customMetadata: {
              count: 1,
            },
          };
          await updateMetadata(storageRef, metaData);

          // Resolve the promise with the download URL
          resolve(downloadURL);
        } catch (error) {
          reject(error);
        }
      }
    );
  });
};

/**
 * Function to delete file from Firebase
 * @param {string} fileUrl
 */
// const deleteFile = (fileUrl) => {
//   const fileRef = ref(storage, fileUrl);
//   deleteObject(fileRef)
//     .then(() => {})
//     .catch((error) => {
//       console.log("Error to delete file:", error);
//     });
// };

// to prevent reuploads
const uploads = new Map();

/**
 * Method to upload files to Firebase Storage
 * @param {[Object]} components - List of components
 * @param {string} scenarioId - The ID of the scenario
 * @param {string} sceneId - The ID of the scene
 * @returns {Promise<void>}
 */
export async function parseMedia(components, scenarioId, sceneId) {
  // remove uploads that no longer exist in components
  const currentUrls = new Set(components.map((c) => c.url));
  for (const key of uploads.keys()) {
    if (!currentUrls.has(key)) {
      uploads.delete(key);
    }
  }

  // upload any media to firebase
  for (const component of components) {
    if (component.type === "audio" && "fileObject" in component) {
      if (uploads.has(component.url)) return;

      const firebaseUrl = await uploadFile(
        component.fileObject,
        scenarioId,
        sceneId
      );

      uploads.set(component.url, firebaseUrl);
      component.url = firebaseUrl;
      delete component.fileObject;
    }
  }

  return components;
}
