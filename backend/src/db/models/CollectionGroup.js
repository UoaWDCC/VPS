import mongoose from "mongoose";

const { Schema, Types, model } = mongoose;

const CollectionGroupSchema = new Schema(
  {
    scenarioId: { type: Types.ObjectId, required: true, index: true },
    name: { type: String, required: true, trim: true },
    order: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

// Helpful indexes for sorting/filtering by scenario
CollectionGroupSchema.index({ scenarioId: 1, order: 1 });
CollectionGroupSchema.index({ scenarioId: 1, name: 1 });

export default model("CollectionGroup", CollectionGroupSchema);
