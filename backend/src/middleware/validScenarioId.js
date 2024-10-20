import mongoose from "mongoose";

const HTTP_BAD_REQUEST = 400;

/**
 * Checks if the scenarioId is valid
 */
export default async function validScenarioId(req, res, next) {
  if (
    req.params?.scenarioId &&
    !mongoose.isValidObjectId(req.params.scenarioId)
  ) {
    res.status(HTTP_BAD_REQUEST).json({ error: "Invalid scenario ID." });
    return;
  }

  next();
}
