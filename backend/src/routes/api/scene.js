import { Router } from "express";

import {
  createScene,
  retrieveSceneList,
  retrieveScene,
  updateScene,
  deleteScene,
  duplicateScene,
} from "../../db/daos/sceneDao";
import auth from "../../middleware/firebase-auth";
import scenarioAuth from "../../middleware/scenario-auth";

const router = Router({ mergeParams: true });

const HTTP_OK = 200;
const HTTP_NO_CONTENT = 204;
const HTTP_NOT_FOUND = 404;

// Get scene infromation
router.get("/full/:sceneId", async (req, res) => {
  const scene = await retrieveScene(req.params.sceneId);

  res.json(scene);
});

router.get("/", async (req, res) => {
  const scenes = await retrieveSceneList(req.params.scenarioId);

  res.json(scenes);
});

// Apply auth middleware to all routes below this point
router.use(auth);
// // Apply scenario auth middleware
router.use(scenarioAuth);

router.post("/", async (req, res) => {
  console.log(`post scene ${req.body.uid}`);
  const { name, components } = req.body;

  const scene = await createScene(req.params.scenarioId, { name, components });

  res.status(HTTP_OK).json(scene);
});

router.put("/:sceneId", async (req, res) => {
  console.log(`put scene ${req.body.uid}`);
  const { name, components } = req.body;

  const scene = await updateScene(req.params.sceneId, { name, components });

  res.status(HTTP_OK).json(scene);
});

router.delete("/:sceneId", async (req, res) => {
  console.log(`delete scene ${req.body.uid}`);
  const deleted = await deleteScene(req.params.scenarioId, req.params.sceneId);

  if (deleted) {
    res.sendStatus(HTTP_NO_CONTENT);
  } else {
    res.sendStatus(HTTP_NOT_FOUND);
  }
});

router.post("/duplicate/:sceneId", async (req, res) => {
  console.log(`dup scene ${req.body.uid}`);
  const scene = await duplicateScene(req.params.scenarioId, req.params.sceneId);

  res.status(HTTP_OK).json(scene);
});

export default router;
