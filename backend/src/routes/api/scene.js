import { Router } from "express";

import { createScene } from "../../db/daos/sceneDao";

const router = Router({ mergeParams: true });

const HTTP_OK = 200;

router.post("/", async (req, res) => {
  const { name } = req.body;

  const scene = await createScene(req.params.scenarioId, name);

  res.status(HTTP_OK).json(scene);
});

export default router;
