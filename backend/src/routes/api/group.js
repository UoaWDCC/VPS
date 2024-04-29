import { Router } from "express";

import { addSceneToPath, getCurrentScene } from "../../db/daos/groupDao";

const router = Router();

const HTTP_OK = 200;
const HTTP_CONFLICT = 409;
const HTTP_NOT_FOUND = 404;

// add a scene to the group's shared path
router.post("/path/:groupId", async (req, res) => {
  const { currentSceneId, nextSceneId } = req.body;
  const { groupId } = req.params;

  // in case someone's still behind the current scene
  const storedCurrScene = await getCurrentScene(groupId);
  if (
    storedCurrScene !== null &&
    // eslint-disable-next-line no-underscore-dangle
    currentSceneId !== storedCurrScene._id.toString()
  ) {
    return res
      .status(HTTP_CONFLICT)
      .json({ error: "Scene mismatch b/w client and server" });
  }
  try {
    await addSceneToPath(groupId, nextSceneId);
    return res.status(HTTP_OK).json("Scene added to path");
  } catch (error) {
    return res
      .status(HTTP_CONFLICT)
      .json({ error: "Scene mismatch b/w client and server" });
  }
});

// get the current scene of the group
router.get("/path/:groupId", async (req, res) => {
  try {
    const { groupId } = req.params;
    const currentScene = await getCurrentScene(groupId);
    return res.status(HTTP_OK).json(currentScene);
  } catch (error) {
    return res.status(HTTP_NOT_FOUND).json({ error: error.message });
  }
});

export default router;
