import mongoose from "mongoose";

const { Schema } = mongoose;

const scenarioSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  scenes: [
    {
      type: Schema.Types.ObjectId,
      ref: "Scene",
    },
  ],
});

const Scenario = mongoose.model("Scenario", scenarioSchema);

export default Scenario;
