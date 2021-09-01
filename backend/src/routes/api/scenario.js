import { Router } from "express";

import {
  createScenario,
  retrieveScenarioList,
  deleteScenario,
} from "../../db/daos/scenarioDao";

import scene from "./scene";

const router = Router();

const HTTP_OK = 200;
const HTTP_NO_CONTENT = 204;
const HTTP_NOT_FOUND = 404;

router.post("/", async (req, res) => {
  const { name } = req.body;

  const scenario = await createScenario(name);

  res.status(HTTP_OK).json(scenario);
});

router.get("/", async (req, res) => {
  const scenarios = await retrieveScenarioList();

  res.status(HTTP_OK).json(scenarios);
});

router.delete("/:scenarioId", async (req, res) => {
  const deleted = await deleteScenario(req.params.scenarioId);

  if (deleted) {
    res.sendStatus(HTTP_NO_CONTENT);
  } else {
    res.sendStatus(HTTP_NOT_FOUND);
  }
});

router.use("/:scenarioId/scene", scene);

export default router;
