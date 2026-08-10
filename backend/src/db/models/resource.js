import { model, Schema } from "mongoose";

const resourceSchema = new Schema(
  {
    scenarioId: {
      type: Schema.Types.ObjectId,
      ref: "Scenario",
      required: true,
      index: true,
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: "Resource",
      required: false,
      index: true,
    },
    type: {
      type: String,
      enum: ["file", "collection"],
      required: true,
    },
    name: { type: String, required: true },
    fileId: {
      type: Schema.Types.ObjectId,
      ref: "UploadedFile",
      required: false,
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
          value: { type: Schema.Types.Mixed, required: true },
        },
      ],
      default: [],
    },
  },
  { versionKey: false, timestamps: true }
);

resourceSchema.index({
  scenarioId: 1,
  parentId: 1,
  createdAt: -1,
});

export default model("Resource", resourceSchema);
