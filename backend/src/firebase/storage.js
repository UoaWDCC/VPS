/* eslint-disable import/prefer-default-export */
import {
  ref,
  deleteObject,
  getMetadata,
  updateMetadata,
} from "firebase/storage";
import { storage } from "./firebase";

const tryDeleteFile = (fileUrl) => {
  const fileRef = ref(storage, fileUrl);

  getMetadata(fileRef).then((metadata) => {
    const prevCount = parseInt(metadata.customMetadata.count, 10);
    if (prevCount < 1) {
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
