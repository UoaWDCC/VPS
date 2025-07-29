import mongoose from "mongoose";

const { Schema } = mongoose;

const resourceSchema = new Schema({
  scenarioId: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["text", "image"],
    required: true,
  },
  textContent: {
    type: String,
    default: "",
  },
  imageContent: {
    type: String,
    default: "",
  },
  requiredFlags: {
    type: [String],
    default: [],
  },
});


const Resource = mongoose.model("Resource", resourceSchema, "resources");

export default Resource;
