import mongoose from "mongoose";

const { Schema, Types, model } = mongoose;

const StoredFileSchema = new Schema(
  {
    scenarioId: { type: Types.ObjectId, required: true, index: true },
    groupId: { type: Types.ObjectId, required: true, index: true },
    childId: { type: Types.ObjectId, required: true, index: true },

    name: { type: String, required: true },
    size: { type: Number, required: true },
    type: { type: String, required: true },

    gridFsId: {
      type: Types.ObjectId,
      required: true,
      unique: true,
      index: true,
    },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

// Query patterns you'll use often
StoredFileSchema.index({
  scenarioId: 1,
  groupId: 1,
  childId: 1,
  createdAt: -1,
});

export default model("StoredFile", StoredFileSchema);
