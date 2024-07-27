import mongoose from "mongoose";

const { Schema } = mongoose;

const resourceSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  textContent: {
    type: String,
  },
  imageContent: {
    type: String,
  },
  required_flags: [String],
});

const Resource = mongoose.model("Resource", resourceSchema, "resources");

export default Resource;
