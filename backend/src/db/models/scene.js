import mongoose from "mongoose";
import { tryDeleteFile } from "../../firebase/storage";

const { Schema } = mongoose;
mongoose.set("useFindAndModify", false);

const sceneSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  components: [
    {
      type: Object,
    },
  ],
});

sceneSchema.pre("remove", function () {
  this.components.forEach((c) => {
    if (c.type === "FIREBASEIMAGE" || c.type === "FIREBASEAUDIO") {
      tryDeleteFile(c.url);
    }
  });
});

const Scene = mongoose.model("Scene", sceneSchema);

export default Scene;
