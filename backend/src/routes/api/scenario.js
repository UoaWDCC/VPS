import { Router } from "express";
import auth from "../../middleware/firebase-auth";
import scenarioAuth from "../../middleware/scenario-auth";

import {
  createScenario,
  retrieveScenarioList,
  updateScenario,
  deleteScenario,
} from "../../db/daos/scenarioDao";

import scene from "./scene";

const router = Router();

const HTTP_OK = 200;
const HTTP_NO_CONTENT = 204;
const HTTP_NOT_FOUND = 404;

router.use("/:scenarioId/scene", scene);

// Apply auth middleware to all routes below this point
router.use(auth);

// Retrieve scenarios for a given user
router.get("/", async (req, res) => {
  const scenarios = await retrieveScenarioList(req.body.uid);

  res.status(HTTP_OK).json(scenarios);
});

// Create a scenario for a user
router.post("/", async (req, res) => {
  const { name, uid } = req.body;

  const scenario = await createScenario(name, uid);

  res.status(HTTP_OK).json(scenario);
});

// Apply scenario auth middleware
router.use("/:scenarioId", scenarioAuth);

// Update a scenario by a user
router.put("/:scenarioId", async (req, res) => {
  const { name } = req.body;
  const scenario = await updateScenario(req.params.scenarioId, {
    name,
  });

  res.status(HTTP_OK).json(scenario);
});

// Delete a scenario of a user
router.delete("/:scenarioId", async (req, res) => {
  const deleted = await deleteScenario(req.params.scenarioId);
  if (deleted) {
    res.sendStatus(HTTP_NO_CONTENT);
  } else {
    res.sendStatus(HTTP_NOT_FOUND);
  }
});

export default router;
