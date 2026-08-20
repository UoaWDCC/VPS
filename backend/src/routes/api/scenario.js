import { Router } from "express";
import auth from "../../middleware/firebaseAuth.js";
import scenarioAuth from "../../middleware/scenarioAuth.js";

import {
  createScenario,
  createProperty,
  deleteScenario,
  getProperties,
  retrieveScenario,
  retrieveScenarioList,
  retrieveRoleList,
  retrieveAccessibleScenarios,
  updateDurations,
  updateScenario,
  editProperty,
  deleteProperty,
  createRole,
  deleteRole,
} from "../../db/daos/scenarioDao.js";

import { retrieveAssignedScenarioList } from "../../db/daos/userDao.js";

import scene from "./scene.js";
import { deleteAccessList } from "../../db/daos/accessDao.js";
import { handle, HttpError } from "../../util/error.js";
import { normaliseString } from "../../util/normalise.js";

const router = Router();

const HTTP_OK = 200;
const HTTP_BAD_REQUEST = 400;
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
  const assignedScenarios = await retrieveAssignedScenarioList(req.body.uid);
  res.status(HTTP_OK).json(assignedScenarios);
});

// TODO: we can perform this more efficiently by using better querying
router.get("/all", async (req, res) => {
  const [owned, assigned, accessible] = await Promise.all([
    retrieveScenarioList(req.body.uid),
    retrieveAssignedScenarioList(req.body.uid),
    retrieveAccessibleScenarios(req.body.uid),
  ]);

  res.status(HTTP_OK).json({
    owned: owned ?? [],
    assigned: assigned ?? [],
    accessible: accessible ?? [],
  });
});

// Create a scenario for a user
router.post(
  "/",
  handle(async (req, res) => {
    const { name, uid, description, estimatedTime } = req.body;

    if (typeof name !== "string" || !name.trim())
      throw new HttpError("scenario name is required", HTTP_BAD_REQUEST);

    const scenario = await createScenario(name.trim(), uid, {
      description,
      estimatedTime,
    });

    res.status(HTTP_OK).json(scenario);
  })
);

// Apply scenario auth middleware
router.use("/:scenarioId", scenarioAuth);

// Get a scenario by id.
router.get("/:scenarioId", async (req, res) => {
  const scenario = await retrieveScenario(req.params.scenarioId);
  res.status(HTTP_OK).json(scenario);
});

// Update a scenario by a user
router.put("/:scenarioId", async (req, res) => {
  const { name, duration, description, estimatedTime } = req.body;
  let scenario = await updateScenario(req.params.scenarioId, {
    name,
    description,
    estimatedTime,
  });

  scenario = await updateDurations(req.params.scenarioId, {
    duration,
  });

  res.status(HTTP_OK).json(scenario);
});

router.patch(
  "/:scenarioId",
  handle(async (req, res) => {
    const { name, description, estimatedTime } = req.body;

    if (name !== undefined && (typeof name !== "string" || !name.trim()))
      throw new HttpError("scenario name cannot be empty", HTTP_BAD_REQUEST);

    const updates = {
      name: name?.trim(),
      description,
      estimatedTime,
    };

    const scenario = await updateScenario(req.params.scenarioId, updates);
    res.status(HTTP_OK).json(scenario);
  })
);

// Delete a scenario
router.delete("/:scenarioId", async (req, res) => {
  const deleted = await deleteScenario(req.params.scenarioId);
  await deleteAccessList(req.params.scenarioId);
  if (deleted) {
    res.sendStatus(HTTP_OK);
  } else {
    res.sendStatus(HTTP_NOT_FOUND);
  }
});

// Get the properties of a scenario
router.get("/:scenarioId/properties", async (req, res) => {
  const scenario = await getProperties(req.params.scenarioId);
  res.status(HTTP_OK).json(scenario);
});

// Create a new property for a scenario
router.post("/:scenarioId/properties", async (req, res) => {
  const { newProperty } = req.body;
  let updatedProperties = await createProperty(
    req.params.scenarioId,
    newProperty
  );

  res.status(HTTP_OK).json(updatedProperties);
});

// Edit a property for a scenario
router.put("/:scenarioId/properties", async (req, res) => {
  const { originalName, newProperty } = req.body;
  let updatedProperties = await editProperty(
    req.params.scenarioId,
    originalName,
    newProperty
  );

  res.status(HTTP_OK).json(updatedProperties);
});

// Delete a property from a scenario
router.delete(
  "/:scenarioId/properties/:propertyIdentifier",
  async (req, res) => {
    let updatedProperties = await deleteProperty(
      req.params.scenarioId,
      req.params.propertyIdentifier
    );
    res.status(HTTP_OK).json(updatedProperties);
  }
);

// Get the role list of a scenario
router.get(
  "/:scenarioId/roles",
  handle(async (req, res) => {
    const roleList = await retrieveRoleList(req.params.scenarioId);
    res.status(HTTP_OK).json(roleList);
  })
);

// Create a new role for a scenario
router.post(
  "/:scenarioId/roles",
  handle(async (req, res) => {
    const { role } = req.body;
    if (!normaliseString(role))
      throw new HttpError("role name is required", HTTP_BAD_REQUEST);
    const roleList = await createRole(req.params.scenarioId, role);
    res.status(HTTP_OK).json(roleList);
  })
);

// Delete a role from a scenario
router.delete(
  "/:scenarioId/roles/:role",
  handle(async (req, res) => {
    const { scenarioId, role } = req.params;
    const roleList = await deleteRole(scenarioId, role);
    res.status(HTTP_OK).json(roleList);
  })
);

export default router;
