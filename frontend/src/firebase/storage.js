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
const uploadFile = async (file, scenarioId, sceneId) => {
  const fileUUID = v4();
  const storageRef = ref(storage, `${scenarioId}/${sceneId}/${fileUUID}`);
  const uploadTask = await uploadBytesResumable(storageRef, file);
  const url = await getDownloadURL(uploadTask.ref);
  console.log("File available at", url);
  const metaData = {
    customMetadata: {
      count: 1,
    },
  };
  await updateMetadata(storageRef, metaData);
  return url;
};

/**
 * Function to delete file from Firebase
 * @param {string} fileUrl
 */
const deleteFile = (fileUrl) => {
  const fileRef = ref(storage, fileUrl);
  deleteObject(fileRef)
    .then(() => {
      console.log("File deleted successfully");
    })
    .catch((error) => {
      console.log("Error to delete file:", error);
    });
};

/**
 * Method to upload file to Firebase storage storage
 * @param {[components]} components - list of components
 * @param {string} scenarioId
 * @param {string} sceneId
 */
const uploadFiles = async (components, scenarioId, sceneId) => {
  for (let i = 0; i < components.length; i += 1) {
    if (
      (components[i].type === "FIREBASEIMAGE" ||
        components[i].type === "FIREBASEAUDIO") &&
      "fileObject" in components[i]
    ) {
      components[i].url = await uploadFile(
        components[i].fileObject,
        scenarioId,
        sceneId
      );
      delete components[i].fileObject;
    }
  }
};

export { uploadFile, deleteFile, uploadFiles };
