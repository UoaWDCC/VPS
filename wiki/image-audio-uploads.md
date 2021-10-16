# Uploading Image and Audio Files

This project uses [Firebase Storage](https://firebase.google.com/docs/storage) to allow users are given the ability to upload their own image and audio files. These files are stored in Firebase's Cloud Storage.

Uploading of these files are done in the frontend, whereas deletion is done in the backend.

## On Import
Image and audio files imported to the canvas temporarily stores the user's local storage file address and file object. These are used to display/preview the image/audio in the Authoring Tool Page. If the scene has not been saved, deleting these components on the canvas is treated like a normal component deletion. 

## On Save

### New Images and Audios
New image and audio files are uploaded to Firebase's Cloud Storage. An additional `count` metadata is also uploaded with each image. This is to keep track of how many scenes in the scenario use that particular file.

The Firebase download urls are retrieved for each file and stored in the database alongside the file id. 

### Removed Images and Audios
When images and audios that were deleted from a scene but were already uploaded to Firebase a check is done on the file's `count` value. If only one scene uses the file (metadata count of 1), the file is deleted from Firebase. Otherwise, the file remains and the metadata is decremented by 1.

## Scene Duplication
When a scene is duplicated all its firebase files have their `count` values incremented by one.