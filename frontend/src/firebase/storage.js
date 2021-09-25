import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { v4 } from "uuid";
import { storage } from "./firebase";

const uploadFile = (file, scenarioId, sceneId) => {
  const fileUUID = v4();
  const storageRef = ref(storage, `${scenarioId}/${sceneId}/${fileUUID}`);
  const uploadTask = uploadBytesResumable(storageRef, file);

  uploadTask.on(
    "state_changed",
    (snapshot) => {
      const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
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
      switch (error.code) {
        case "storage/unauthorized":
          console.log("Unauthorised to upload file");
          break;
        case "storage/unknown":
          console.log(
            "Unknown error occured with file upload:",
            error.serverResponse
          );
          break;
        default:
          console.log("Error Uploading File:", error.serverResponse);
      }
    },
    () => {
      // Upload completed successfully, downloadURL should be stored in database and used to access or delete file
      getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
        console.log("File available at", downloadURL);
      });
    }
  );
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

export { uploadFile, deleteFile };
