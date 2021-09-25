import { retrieveScenario } from "../db/daos/scenarioDao";

/**
 * Checks if the scenario belongs to the user
 * @param {*} req params must have scenarioId
 */
export default async function scenarioAuth(req, res, next) {
  const dbScenario = await retrieveScenario(req.params.scenarioId);

  if (dbScenario) {
    if (req.body.uid === dbScenario.uid) {
      next();
    } else {
      res.sendStatus(401);
    }
  } else {
    res.sendStatus(404);
  }
}
