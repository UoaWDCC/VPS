import mongoose from "mongoose";

const { Schema } = mongoose;

const resourceSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  textContent: [String],
  imageContent: {
    type: String,
  },
  requiredFlags: [String],
});

const Resource = mongoose.model("Resource", resourceSchema, "resources");

export default Resource;
