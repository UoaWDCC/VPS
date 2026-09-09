import mongoose from "mongoose";
import { operations } from "../../util/properties/propertyTypes.js";

const { Schema } = mongoose;

export const conditionSchema = new Schema(
  {
    id: {
      type: String,
      required: true,
    },
    stateVariableId: {
      type: String,
      required: true,
    },
    comparator: {
      type: String,
      enum: ["=", "!=", "<", ">"],
      required: true,
    },
    value: {
      type: Schema.Types.Mixed,
      required: true,
    },
  },
  { _id: false }
);

export const operationSchema = new Schema(
  {
    id: {
      type: String,
      required: true,
    },
    stateVariableId: {
      type: String,
      required: true,
    },
    operation: {
      type: String,
      enum: Object.values(operations),
      required: true,
    },
    value: {
      type: Schema.Types.Mixed,
      required: true,
    },
  },
  { _id: false }
);

export const actionSchema = new Schema(
  {
    id: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    linkedScene: {
      type: Schema.Types.ObjectId,
      ref: "Scene",
      default: null,
    },
    conditions: {
      type: [conditionSchema],
      default: [],
    },
    operations: {
      type: [operationSchema],
      default: [],
    },
    index: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);
