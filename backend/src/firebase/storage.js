/* eslint-disable import/prefer-default-export */
import {
  ref,
  deleteObject,
  getMetadata,
  updateMetadata,
} from "firebase/storage";
import { storage } from "./firebase.js";

/**
 * Attempts to delete a file from the firebase storage.
 * A file is deleted if only one scene uses it (metadata count of 1).
 * Otherwise, the file remains and the metadata is decremented.
 * @param {String} fileUrl firebase storage link to file
 */
const tryDeleteFile = (fileUrl) => {
  const fileRef = ref(storage, fileUrl);

  getMetadata(fileRef).then((metadata) => {
    const prevCount = parseInt(metadata.customMetadata.count, 10);
    if (prevCount > 1) {
      const newMetadata = {
        customMetadata: {
          count: prevCount - 1,
        },
      };
      updateMetadata(fileRef, newMetadata);
    } else {
      deleteObject(fileRef);
    }
  });
};

/**
 * Increments the metadata count of a file in firebase storage
 * @param {String} fileUrl firebase storage link to file
 */
const updateFileMetadata = (fileUrl) => {
  const fileRef = ref(storage, fileUrl);

  getMetadata(fileRef).then((metadata) => {
    const prevCount = parseInt(metadata.customMetadata.count, 10);
    const newMetadata = {
      customMetadata: {
        count: prevCount + 1,
      },
    };
    updateMetadata(fileRef, newMetadata);
  });
};

export { tryDeleteFile, updateFileMetadata };
