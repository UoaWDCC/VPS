import mongoose from "mongoose";
import { GridFSBucket, ObjectId } from "mongodb";
import { Readable } from "stream";

let bucket;

/** Create (or get existing) GridFS bucket on the current Mongoose connection. */
export function getBucket() {
  if (!bucket) {
    const db = mongoose.connection.db;
    if (!db) throw new Error("Mongo connection not ready");
    bucket = new GridFSBucket(db, {
      bucketName: process.env.GRIDFS_BUCKET_NAME || "resources",
    });
  }
  return bucket;
}

export function bufferToStream(buffer) {
  const readable = new Readable();
  readable.push(buffer);
  readable.push(null);
  return readable;
}

export async function uploadBufferToGridFS({ filename, contentType, buffer, metadata = {} }) {
  const gfs = getBucket();
  const uploadStream = gfs.openUploadStream(filename, {
    contentType,
    metadata,
  });
  return new Promise((resolve, reject) => {
    bufferToStream(buffer)
      .pipe(uploadStream)
      .on("error", reject)
      .on("finish", () => resolve(uploadStream.id));
  });
}

/** Stream a GridFS file to an Express response */
export function streamGridFsToResponse({ fileId, res, contentType, filename, disposition = "inline" }) {
  const gfs = getBucket();
  res.setHeader("Content-Type", contentType || "application/octet-stream");
  res.setHeader("Content-Disposition", `${disposition}; filename="${encodeURIComponent(filename)}"`);
  const stream = gfs.openDownloadStream(new ObjectId(fileId));
  stream.on("error", (err) => {
    if (err.code === "ENOENT") return res.status(404).json({ error: "File not found" });
    return res.status(500).json({ error: "Failed to stream file" });
  });
  stream.pipe(res);
}

/** Delete a GridFS file by its ID */
export async function deleteGridFsById(fileId) {
  const gfs = getBucket();
  await gfs.delete(new ObjectId(fileId));
}
