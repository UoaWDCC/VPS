/* eslint-disable no-param-reassign */
/* eslint-disable no-await-in-loop */
import {
  ref,
  uploadBytesResumable,
  updateMetadata,
  getDownloadURL,
  deleteObject,
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
const uploadFile = async (file, scenarioId, sceneId, isEndImage) => {
  const fileUUID = isEndImage ? "endImage" : v4(); // Generate a UUID or use "endImage"
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
const deleteFile = (fileUrl) => {
  const fileRef = ref(storage, fileUrl);
  deleteObject(fileRef)
    .then(() => {})
    .catch((error) => {
      console.log("Error to delete file:", error);
    });
};

/**
 * Method to upload files to Firebase Storage
 * @param {[Object]} components - List of components
 * @param {File} endImage - The end image file to upload
 * @param {string} scenarioId - The ID of the scenario
 * @param {string} sceneId - The ID of the scene
 * @returns {Promise<void>}
 */
const uploadFiles = async (components, endImage, scenarioId, sceneId) => {
  // Loop through each component and upload if it's a FIREBASEIMAGE or FIREBASEAUDIO
  for (let i = 0; i < components.length; i += 1) {
    if (
      (components[i].type === "FIREBASEIMAGE" ||
        components[i].type === "FIREBASEAUDIO") &&
      "fileObject" in components[i]
    ) {
      components[i].url = await uploadFile(
        components[i].fileObject,
        scenarioId,
        sceneId,
        false
      );
      delete components[i].fileObject; // Remove the fileObject after uploading
    }
  }

  // Upload the endImage if provided
  if (endImage) {
    const endImageUrl = await uploadFile(endImage, scenarioId, sceneId, true);
    console.log("End image uploaded at:", endImageUrl);
  }
};

export { uploadFile, deleteFile, uploadFiles };
