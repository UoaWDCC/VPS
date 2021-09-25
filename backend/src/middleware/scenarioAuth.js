import { retrieveScenario } from "../db/daos/scenarioDao";

const HTTP_UNAUTHORISED = 401;
const HTTP_NOT_FOUND = 404;

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
      res.sendStatus(HTTP_UNAUTHORISED);
    }
  } else {
    res.sendStatus(HTTP_NOT_FOUND);
  }
}
