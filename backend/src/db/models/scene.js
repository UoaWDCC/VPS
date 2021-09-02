import mongoose from "mongoose";

const { Schema } = mongoose;
mongoose.set("useFindAndModify", false);

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

const Scene = mongoose.model("Scene", sceneSchema);

export default Scene;
