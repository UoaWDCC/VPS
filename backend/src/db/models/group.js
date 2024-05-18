import mongoose from "mongoose";

const { Schema } = mongoose;

const groupSchema = new Schema({
  users: [
    {
      type: Object,
    },
  ],
  notes: {
    type: Map,
    of: [String],
  },
  path: [String],
  scenarioId: {
    type: String,
  },
});

const Group = mongoose.model("Group", groupSchema, "groups");

export default Group;
