import mongoose from "mongoose";

const { Schema, Types, model } = mongoose;

const CollectionChildSchema = new Schema(
  {
    scenarioId: { type: Types.ObjectId, required: true, index: true },
    groupId: { type: Types.ObjectId, required: true, index: true },
    name: { type: String, required: true, trim: true },
    order: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

CollectionChildSchema.index({ scenarioId: 1, groupId: 1, order: 1 });
CollectionChildSchema.index({ groupId: 1, name: 1 });

export default model("CollectionChild", CollectionChildSchema);
