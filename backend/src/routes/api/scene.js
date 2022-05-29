import { Router } from "express";

import {
  createScene,
  retrieveSceneList,
  retrieveScene,
  updateScene,
  deleteScene,
  duplicateScene,
} from "../../db/daos/sceneDao";
import auth from "../../middleware/firebaseAuth";
import scenarioAuth from "../../middleware/scenarioAuth";

const router = Router({ mergeParams: true });

const HTTP_OK = 200;
const HTTP_NO_CONTENT = 204;
const HTTP_NOT_FOUND = 404;

// Get scene infromation
router.get("/full/:sceneId", async (req, res) => {
  const scene = await retrieveScene(req.params.sceneId);

  res.json(scene);
});

// Retrieve all scenes of a scenario
router.get("/", async (req, res) => {
  const scenes = await retrieveSceneList(req.params.scenarioId);

  res.json(scenes);
});

// Apply auth middleware to all routes below this point
router.use(auth);
// // Apply scenario auth middleware
router.use(scenarioAuth);

// Create a scene for a scenario
router.post("/", async (req, res) => {
  const { name, components, time } = req.body;

  const scene = await createScene(req.params.scenarioId, { name, components, time });

  res.status(HTTP_OK).json(scene);
});

// Update a scene
router.put("/:sceneId", async (req, res) => {
  const { name, components, time } = req.body;

  const scene = await updateScene(req.params.sceneId, { name, components, time });

  res.status(HTTP_OK).json(scene);
});

// Delete a scene
router.delete("/:sceneId", async (req, res) => {
  const deleted = await deleteScene(req.params.scenarioId, req.params.sceneId);

  if (deleted) {
    res.sendStatus(HTTP_NO_CONTENT);
  } else {
    res.sendStatus(HTTP_NOT_FOUND);
  }
});

// Duplicate a scene
router.post("/duplicate/:sceneId", async (req, res) => {
  const scene = await duplicateScene(req.params.scenarioId, req.params.sceneId);

  res.status(HTTP_OK).json(scene);
});

export default router;
