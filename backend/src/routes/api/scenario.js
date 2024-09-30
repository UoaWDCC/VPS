import { Router } from "express";
import auth from "../../middleware/firebaseAuth.js";
import scenarioAuth from "../../middleware/scenarioAuth.js";

import {
  createScenario,
  retrieveScenarioList,
  updateScenario,
  deleteScenario,
  updateDurations,
} from "../../db/daos/scenarioDao.js";

import { retrieveAssignedScenarioList } from "../../db/daos/userDao.js";

import scene from "./scene.js";

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

// get assigned scenarios for an user
router.get("/assigned", async (req, res) => {
  const userId = req.body.uid;
  const assignedScenarios = await retrieveAssignedScenarioList(userId);
  res.status(HTTP_OK).json(assignedScenarios);
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
  const { name, duration } = req.body;
  let scenario = await updateScenario(req.params.scenarioId, {
    name,
  });

  scenario = await updateDurations(req.params.scenarioId, {
    duration,
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
