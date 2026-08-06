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
  // Time the current (head) scene was entered — used for the server-authoritative timer
  currentSceneEnteredAt: {
    type: Date,
  },
  scenarioId: {
    type: String,
  },
  currentFlags: [String],
  stateVariables: [Schema.Types.Mixed],
  stateVersion: {
    type: Number,
    default: 0,
  },
});

const Group = mongoose.model("Group", groupSchema, "groups");

export default Group;
