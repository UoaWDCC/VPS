import { Router } from "express";

import { addSceneToPath, getCurrentScene } from "../../db/daos/groupDao";

const router = Router();

const HTTP_OK = 200;
const HTTP_CONFLICT = 409

// add a scene to the group's shared path
router.post("/path/:groupId", async (req, res) => {
  const { currentSceneId, nextSceneId } = req.body;
  // in case someone's still behind the current scene
  if (!currentSceneId === getCurrentScene()._id) {
    return res.status(HTTP_CONFLICT).json({ error: 'Scene mismatch b/w client and server' });
  }
  try {
    await addSceneToPath(req.params.groupId, nextSceneId);
    return res.status(HTTP_OK).json("Scene added to path");
  } catch (error) {
    return res.status(HTTP_CONFLICT).json({ error: 'Scene mismatch b/w client and server' });
  }
});

// get the current scene of the group
router.get("/path/:groupId", async (req, res) => {
    //
});

export default router;
