import mongoose from "mongoose";
import { tryDeleteFile } from "../../firebase/storage.js";

const { Schema } = mongoose;

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
  time: {
    type: Number,
  },
  visited: {
    type: Number,
    default: 0,
  },
  roles: [
    {
      type: String,
    },
  ],
});

// before removal of scene from the database, first attempt to delete all user-uploaded images from firebase
sceneSchema.pre("remove", function () {
  this.components.forEach((c) => {
    if (c.type === "FIREBASEIMAGE" || c.type === "FIREBASEAUDIO") {
      tryDeleteFile(c.url);
    }
  });
});

const Scene = mongoose.model("Scene", sceneSchema);

export default Scene;
