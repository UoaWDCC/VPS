import { v4 as uuidv4 } from "uuid";
import { getBucket } from "./firebase.js";

// upload
export async function uploadFile(buffer, contentType) {
  if (!contentType) throw new Error("contentType is required");

  const downloadToken = uuidv4();
  const uniqueFilename = uuidv4();
  const file = getBucket().file(`files/${uniqueFilename}`);

  try {
    await file.save(buffer, {
      metadata: {
        contentType,
        metadata: {
          firebaseStorageDownloadTokens: downloadToken,
        },
      },
    });
  } catch (err) {
    throw new Error(`upload failed: ${err.message}`);
  }

  const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${getBucket().name}/o/${encodeURIComponent(file.name)}?alt=media&token=${downloadToken}`;

  return { path: file.name, url: publicUrl };
}

export async function overwriteFile(path, buffer, contentType) {
  if (!path) throw new Error("path is required");
  if (!contentType) throw new Error("contentType is required");

  const file = getBucket().file(path);
  try {
    const [metadata] = await file.getMetadata();
    await file.save(buffer, {
      metadata: {
        contentType,
        metadata: metadata.metadata,
      },
    });
  } catch (err) {
    throw new Error(`overwrite failed: ${err.message}`);
  }
}

// delete
export async function deleteFile(path) {
  if (!path) throw new Error("path is required");
  try {
    await getBucket().file(path).delete();
  } catch (err) {
    throw new Error(`delete failed: ${err.message}`);
  }
}
