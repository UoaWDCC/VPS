import mongoose from "mongoose";
import Scene from "./scene";

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
});

scenarioSchema.pre("remove", async function () {
  this.scenes.forEach(async (sceneId) => {
    const scene = await Scene.findById(sceneId);
    await scene.remove();
  });
});

const Scenario = mongoose.model("Scenario", scenarioSchema);

export default Scenario;
