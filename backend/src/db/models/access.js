import mongoose from "mongoose";

const { Schema } = mongoose;

const userInfoSchema = new Schema(
  {
    name: { type: String },
    email: { type: String },
    addedAt: { type: Date, default: new Date() },
  },
  { _id: false }
);

const accessSchema = new Schema(
  {
    scenarioId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
    },
    ownerId: {
      type: String,
      required: true,
    },
    users: {
      type: Map,
      of: userInfoSchema,
      defaul: {},
    },
  },
  { timestamps: true }
);

const Access = mongoose.model("Access", accessSchema, "access");

export default Access;
