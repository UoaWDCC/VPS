import { HttpStatusCode } from "axios";
import { retrieveScenario } from "../db/daos/scenarioDao.js";
import { hasAccess } from "../db/daos/accessDao.js";

/**
 * Checks if the scenario is accessable by the user
 * @param {*} req params must have scenarioId
 */
export default async function scenarioAuth(req, res, next) {
  try {
    const scenario = await retrieveScenario(req.params.scenarioId);
    if (!scenario) return res.sendStatus(HttpStatusCode.NotFound);

    // is direct owner or has been given access
    const { uid } = req.body;
    if (uid === scenario.uid || (await hasAccess(scenario._id, uid)))
      return next();

    return res.sendStatus(HttpStatusCode.Unauthorized);
  } catch (err) {
    return next(err);
  }
}

export async function isAuthor(scenarioId, uid) {
  const scenario = await retrieveScenario(scenarioId);
  if (!scenario) return false;
  if (uid === scenario.uid || (await hasAccess(scenario._id, uid))) return true;
  return false;
}

/**
 * Checks if the scenario is owned by the user
 * @param {*} req params must have scenarioId
 */
export async function scenarioOwnerAuth(req, res, next) {
  try {
    const scenario = await retrieveScenario(req.params.scenarioId);
    if (!scenario) return res.sendStatus(HttpStatusCode.NotFound);

    if (req.body.uid === scenario.uid) return next();

    return res.sendStatus(HttpStatusCode.Unauthorized);
  } catch (err) {
    return next(err);
  }
}
