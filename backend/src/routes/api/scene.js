import { Router } from "express";

import {
  createScene,
  retrieveSceneList,
  retrieveScene,
  retrieveSceneTags,
  updateScene,
  deleteScene,
  duplicateScene,
  incrementVisisted,
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

// Retrieve all scenes with full scene data
router.get("/all", async (req, res) => {
  const scenes = await retrieveSceneList(req.params.scenarioId);
  const fullScenes = await Promise.all(
    // eslint-disable-next-line no-underscore-dangle
    scenes.map((it) => retrieveScene(it._id))
  ).catch((err) => res.status(HTTP_NOT_FOUND).send(err));
  res.status(HTTP_OK).json(fullScenes);
});

// Retrieve all scenes of a scenario
router.get("/tags", async (req, res) => {
  const sceneTags = await retrieveSceneTags(req.params.scenarioId);

  sceneTags.map((tagObj) => {
    // eslint-disable-next-line no-underscore-dangle, no-param-reassign
    tagObj._doc.tag = tagObj._doc.tag || "No tag";
    return tagObj;
  });

  res.json(sceneTags);
});

// Apply auth middleware to all routes below this point
router.use(auth);
// Apply scenario auth middleware
router.use(scenarioAuth);

// Create a scene for a scenario
router.post("/", async (req, res) => {
  const { name, components, time } = req.body;

  const scene = await createScene(req.params.scenarioId, {
    name,
    components,
    time,
  });

  res.status(HTTP_OK).json(scene);
});

// Update a scene
router.put("/:sceneId", async (req, res) => {
  const { name, components, time } = req.body;

  const scene = await updateScene(req.params.sceneId, {
    name,
    components,
    time,
  });

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

// Update a scene's visited field by incrementing by 1
router.put("/visited/:sceneId", async (req, res) => {
  const scene = await incrementVisisted(req.params.sceneId);
  res.status(HTTP_OK).json(scene);
});

export default router;
