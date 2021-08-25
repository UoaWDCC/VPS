import { Router } from "express";

import { createScene, retrieveSceneList } from "../../db/daos/sceneDao";

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

export default router;
