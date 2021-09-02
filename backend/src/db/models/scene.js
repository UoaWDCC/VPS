import mongoose from "mongoose";

const { Schema } = mongoose;

const sceneSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  components: [
    {
      type: Schema.Types.ObjectId,
      ref: "Component",
    },
  ],
});

sceneSchema.pre("remove", async () => {
  // TODO: delete components
  // await Component.deleteMany({ _id: { $in: this.components } });
});

const Scene = mongoose.model("Scene", sceneSchema);

export default Scene;
