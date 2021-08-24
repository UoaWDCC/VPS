import { Router } from "express";

import { createScenario } from "../../db/daos/scenarioDao";

const router = Router();

const HTTP_OK = 200;

router.post("/", async (req, res) => {
  const { name } = req.body;

  const scenario = await createScenario(name);

  res.status(HTTP_OK).json(scenario);
});

export default router;
