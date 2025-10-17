// import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
// import { v4 as uuidv4 } from "uuid";
// import { getFirestore, collection, addDoc, setDoc } from "firebase/firestore";
// import { getAuth } from "firebase/auth";
// import { api, handleGeneric } from "../../../util/api.js";
// import { defaults } from "../scene/operations/component.js";
// import { add } from "../scene/operations/modifiers.js";

// TODO: integrate this back in

// /**
//  * call this when user adds firebase audio
//  *
//  * @param {object} fileObject
//  * @param {string} url
//  */
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
