import { Router } from "express";

import {
  createScene,
  retrieveSceneList,
  retrieveScene,
  updateScene,
} from "../../db/daos/sceneDao";

const router = Router({ mergeParams: true });

const HTTP_OK = 200;

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

router.put("/:sceneId", async (req, res) => {
  const { name, components } = req.body;

  const scene = await updateScene(req.params.sceneId, { name, components });

  res.status(HTTP_OK).json(scene);
});

export default router;
