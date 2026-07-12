import mongoose from "mongoose";

const { Schema } = mongoose;

const accessSchema = new Schema(
  {
    scenarioId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    accessList: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

const Access = mongoose.model("Access", accessSchema, "access");

export default Access;
