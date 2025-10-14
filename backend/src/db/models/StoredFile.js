import mongoose from "mongoose";

const { Schema, Types, model } = mongoose;

const StoredFileSchema = new Schema(
  {
    scenarioId: { type: Types.ObjectId, required: true, index: true },
    groupId: { type: Types.ObjectId, required: true, index: true },

    name: { type: String, required: true },
    size: { type: Number, required: true },
    type: { type: String, required: true },

    uploaderUid: { type: String, default: "unknown", index: true },

    gridFsId: {
      type: Types.ObjectId,
      required: true,
      unique: true,
      index: true,
    },

    stateConditionals: {
      type: [
        {
          stateVariableId: { type: String, required: true },
          comparator: {
            type: String,
            enum: ["=", "!=", "<", ">"],
            required: true,
          },
          value: { type: String, required: true },
        },
      ],
      default: [],
    },
  },
  {
    versionKey: false,
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Common query optimization
StoredFileSchema.index({
  scenarioId: 1,
  groupId: 1,
  createdAt: -1,
});

export default model("StoredFile", StoredFileSchema);
