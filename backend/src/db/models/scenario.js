import mongoose from "mongoose";

const { Schema } = mongoose;

const scenarioSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  uid: {
    type: String,
    required: true,
  },
  scenes: [
    {
      type: Schema.Types.ObjectId,
      ref: "Scene",
    },
  ],
  roleList: [
    {
      type: String,
    },
  ],
  stateVariables: [
    {
      type: Object,
    },
  ],
  description: {
    type: String,
    default: "",
  },
  estimatedTime: {
    type: String,
    default: "",
  },
});

const Scenario = mongoose.model("Scenario", scenarioSchema);

export default Scenario;
