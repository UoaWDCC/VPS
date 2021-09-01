import { Router } from "express";

import {
  createScene,
  retrieveSceneList,
  retrieveScene,
  deleteScene,
} from "../../db/daos/sceneDao";

const router = Router({ mergeParams: true });

const HTTP_OK = 200;
const HTTP_NO_CONTENT = 204;
const HTTP_NOT_FOUND = 404;

router.post("/", async (req, res) => {
  const { name } = req.body;

  const scene = await createScene(req.params.scenarioId, name);

  res.status(HTTP_OK).json(scene);
});

router.get("/", async (req, res) => {
  const scenes = await retrieveSceneList(req.params.scenarioId);

  res.json(scenes);
});

router.get("/full/:sceneId", async (req, res) => {
  const scene = await retrieveScene(req.params.sceneId);

  res.json(scene);
});

router.delete("/:sceneId", async (req, res) => {
  const deleted = await deleteScene(req.params.scenarioId, req.params.sceneId);

  if (deleted) {
    res.sendStatus(HTTP_NO_CONTENT);
  } else {
    res.sendStatus(HTTP_NOT_FOUND);
  }
});

export default router;
