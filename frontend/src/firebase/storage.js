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

const uploadFiles = async (components, scenarioId, sceneId) => {
  for (let i = 0; i < components.length; i += 1) {
    if (
      components[i].type === "FIREBASEIMAGE" &&
      components[i].fileObject != null
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
