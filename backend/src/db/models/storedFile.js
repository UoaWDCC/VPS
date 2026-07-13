import mongoose from "mongoose";

const { Schema, model } = mongoose;

const storedFileSchema = new Schema(
  {
    scenarioId: { type: String, required: true, index: true },
    groupId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    fileId: { type: String, required: true },
    url: { type: String, required: true },
    type: {
      type: String,
      enum: ["image", "audio", "document"],
      required: true,
    },
    contentType: { type: String, required: true },
    stateConditionals: {
      type: [
        {
          stateVariableId: { type: String, required: true },
          comparator: {
            type: String,
            enum: ["=", "!=", "<", ">"],
            required: true,
          },
          value: { type: Schema.Types.Mixed, required: true },
        },
      ],
      default: [],
    },
  },
  { versionKey: false }
);

storedFileSchema.index({
  scenarioId: 1,
  groupId: 1,
});

export default model("StoredFile", storedFileSchema);
