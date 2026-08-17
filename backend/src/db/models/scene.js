import mongoose from "mongoose";

const { Schema } = mongoose;

const backgroundSchema = new Schema(
  {
    kind: {
      type: String,
      enum: ["image", "color"],
      default: "image",
      required: true,
    },
    fileId: {
      type: Schema.Types.ObjectId,
      ref: "UploadedFile",
      required() {
        return this.kind === "image";
      },
    },
    href: {
      type: String,
      required() {
        return this.kind === "image";
      },
    },
    fit: {
      type: String,
      enum: ["cover", "contain", "fill"],
      default: "cover",
    },
    color: {
      type: String,
      match: /^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/,
      required() {
        return this.kind === "color";
      },
    },
  },
  { _id: false }
);

backgroundSchema.pre("validate", function () {
  if (this.kind === "color") {
    if (this.fileId != null) {
      this.invalidate("fileId", "fileId is only valid for image backgrounds");
    }
    if (this.href != null) {
      this.invalidate("href", "href is only valid for image backgrounds");
    }
  }

  if (this.kind === "image" && this.color != null) {
    this.invalidate("color", "color is only valid for color backgrounds");
  }
});

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
  background: {
    type: backgroundSchema,
    default: null,
  },
});

// NOTE: this will be replaced by a scheduled remove of unused files
//
// before removal of scene from the database, first attempt to delete all user-uploaded images from firebase
// sceneSchema.pre("remove", function () {
//   this.components.forEach((c) => {
//     if (c.type === "image" || c.type === "audio") {
//       tryDeleteFile(c.href ?? c.url);
//     }
//   });
// });

const Scene = mongoose.model("Scene", sceneSchema);

export default Scene;
