import mongoose from "mongoose";

const { Schema } = mongoose;

// How much of the AI assistant an author has used on one day (UTC). The _id is
// `${uid}:${day}`, which Mongo already keeps unique, so counting a request is
// one atomic update and two requests at once can't both take the last place.
const aiUsageSchema = new Schema(
  {
    _id: { type: String },
    uid: { type: String, required: true, index: true },
    day: { type: String, required: true },
    requests: { type: Number, default: 0 },
    promptTokens: { type: Number, default: 0 },
    completionTokens: { type: Number, default: 0 },
    // old days are deleted by Mongo
    expiresAt: { type: Date, required: true, expires: 0 },
  },
  { timestamps: true }
);

const AiUsage = mongoose.model("AiUsage", aiUsageSchema, "aiUsage");

export default AiUsage;
