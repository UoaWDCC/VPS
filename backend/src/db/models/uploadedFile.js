import { model, Schema } from "mongoose";

const uploadedFileSchema = new Schema(
  {
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ["image", "audio", "document"],
      required: true,
    },
    path: { type: String, required: true }, // firebase storage path
    url: { type: String, required: true }, // public url
    contentType: { type: String, required: true },
    size: { type: Number, required: true },
    uploaderUid: { type: String, required: true, index: true },
    scenarioId: {
      type: Schema.Types.ObjectId,
      ref: "Scenario",
      required: true,
      index: true,
    },
    refCount: { type: Number, default: 0, min: 0 },
    orphanedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

uploadedFileSchema.index({ scenarioId: 1, createdAt: -1 });

export default model("UploadedFile", uploadedFileSchema);
