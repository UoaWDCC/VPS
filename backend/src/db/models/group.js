import mongoose from "mongoose";

const { Schema } = mongoose;

const groupSchema = new Schema({
  users: {
    type: Map,
    of: {
      type: String,
    },
    required: true,
  },
  notes: {
    type: Map,
    of: [String],
  },
  path: [String],
});

const Group = mongoose.model("Group", groupSchema, "groups");

export default Group;
