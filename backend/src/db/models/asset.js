import { model, Schema } from "mongoose";

export const ASSET_NAME_MAX_LENGTH = 255;

/**
 * An entry in a user's asset library: a file they uploaded once and can use in
 * any of their scenarios. Distinct from UploadedFile, which belongs to a single
 * scenario. Using an asset in a scenario creates an UploadedFile that points at
 * the same stored object, so scenes keep working as they do for any upload.
 */
const assetSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: ASSET_NAME_MAX_LENGTH,
    },
    type: {
      type: String,
      enum: ["image", "audio", "document"],
      required: true,
    },
    tags: { type: [String], default: [] },
    path: { type: String, required: true }, // firebase storage path
    url: { type: String, required: true }, // public url
    contentType: { type: String, required: true },
    size: { type: Number, required: true },
    ownerUid: { type: String, required: true, index: true },
  },
  { timestamps: true }
);

assetSchema.index({ ownerUid: 1, createdAt: -1 });

export default model("Asset", assetSchema);
