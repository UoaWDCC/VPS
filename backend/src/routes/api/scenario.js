import { Router } from "express";
import auth from "../../middleware/firebaseAuth.js";
import scenarioAuth from "../../middleware/scenarioAuth.js";
import validScenarioId from "../../middleware/validScenarioId.js";

import {
  createScenario,
  createStateVariable,
  deleteScenario,
  getStateVariables,
  retrieveScenario,
  retrieveScenarioList,
  updateDurations,
  updateScenario,
  editStateVariable,
  deleteStateVariable,
} from "../../db/daos/scenarioDao.js";

import { retrieveAssignedScenarioList } from "../../db/daos/userDao.js";

import scene from "./scene.js";
import { createAccessList, deleteAccessList } from "../../db/daos/accessDao.js";

const router = Router();

const HTTP_OK = 200;
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
  await createAccessList(scenario._id, name, uid);

  res.status(HTTP_OK).json(scenario);
});

// Apply scenario auth middleware
router.use("/:scenarioId", validScenarioId);
router.use("/:scenarioId", scenarioAuth);

// Get a scenario by id.
router.get("/:scenarioId", async (req, res) => {
  const scenario = await retrieveScenario(req.params.scenarioId);
  res.status(HTTP_OK).json(scenario);
});

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
  const accessDeleted = await deleteAccessList(req.params.scenarioId, req.body.uid);
  if (deleted && accessDeleted) {
    res.sendStatus(HTTP_OK);
  } else {
    res.sendStatus(HTTP_NOT_FOUND);
  }
});

// Get the state variables of a scenario
router.get("/:scenarioId/stateVariables", async (req, res) => {
  const scenario = await getStateVariables(req.params.scenarioId);
  res.status(HTTP_OK).json(scenario);
});

// Create a new state variable for a scenario
router.post("/:scenarioId/stateVariables", async (req, res) => {
  const { newStateVariable } = req.body;
  let updatedStateVariables = await createStateVariable(
    req.params.scenarioId,
    newStateVariable
  );

  res.status(HTTP_OK).json(updatedStateVariables);
});

// Edit a state variable for a scenario
router.put("/:scenarioId/stateVariables", async (req, res) => {
  const { originalName, newStateVariable } = req.body;
  let updatedStateVariables = await editStateVariable(
    req.params.scenarioId,
    originalName,
    newStateVariable
  );

  res.status(HTTP_OK).json(updatedStateVariables);
});

// Delete a state variable from a scenario
router.delete(
  "/:scenarioId/stateVariables/:stateVariableIdentifier",
  async (req, res) => {
    let updatedStateVariables = await deleteStateVariable(
      req.params.scenarioId,
      req.params.stateVariableIdentifier
    );
    res.status(HTTP_OK).json(updatedStateVariables);
  }
);

export default router;
