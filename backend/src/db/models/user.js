import mongoose from "mongoose";

const { Schema } = mongoose;

const userSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  uid: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  pictureURL: {
    type: String,
    required: true,
  },
  assigned: [
    {
      type: String,
    },
  ],
  // Map of scenarioId to path (sceneIds)
  paths: {
    type: Map,
    of: [String],
    default: {},
  },
});

const User = mongoose.model("model", userSchema, "users");

export default User;
