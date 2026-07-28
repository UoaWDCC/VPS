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
  // Seconds for the scene timer; absent/null means no timer. The authoring
  // tool never stores 0 (it normalises non-positive input to null), so this
  // enforces the same invariant the rest of the app already assumes.
  time: {
    type: Number,
    min: 1,
  },
  timerStateOperations: [
    {
      type: Object,
    },
  ],
  visited: {
    type: Number,
    default: 0,
  },
  roles: [
    {
      type: String,
    },
  ],
  directLink: {
    type: Schema.Types.ObjectId,
    ref: "Scene",
    default: null,
  },
});

// before removal of scene from the database, first attempt to delete all user-uploaded images from firebase
sceneSchema.pre("remove", function () {
  this.components.forEach((c) => {
    if (c.type === "image" || c.type === "audio") {
      tryDeleteFile(c.href ?? c.url);
    }
  });
});

const Scene = mongoose.model("Scene", sceneSchema);

export default Scene;
