import { Router } from "express";

import { createScenario, retrieveScenarioList } from "../../db/daos/scenarioDao";

import scene from "./scene";

const router = Router();

const HTTP_OK = 200;

router.post("/", async (req, res) => {
  const { name } = req.body;

  const scenario = await createScenario(name);

  res.status(HTTP_OK).json(scenario);
});

router.get("/", async (req, res) => {

  const scenarios = await retrieveScenarioList();

  res.status(HTTP_OK).json(scenarios);
});

router.use("/:scenarioId/scene", scene);

export default router;
