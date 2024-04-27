import { Router } from "express";

import { addSceneToPath, getCurrentScene } from "../../db/daos/groupDao";
import createGroup from "../../db/daos/groupDao";
import { updateRoleList } from "../../db/daos/scenarioDao";
import Group from "../../db/models/group";

const router = Router();

const HTTP_OK = 200;
const HTTP_CONFLICT = 409;
const HTTP_NOT_FOUND = 404;
const HTTP_NO_CONTENT = 204;

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

// create a new group
router.post("/:scenarioId", async (req, res) => {
  const { groupList, roleList } = req.body;
  const { scenarioId } = req.params;

  // check for scenario role list
  // if it doesn't exist, create it
  await updateRoleList(scenarioId, roleList);

  // validation
  groupList.forEach((userList) => {
    if (!userList) {
      res.status(HTTP_NO_CONTENT).send("No content");
    }

    const roles = [];
    userList.forEach((user) => {
      if (!user.email) {
        res.status(HTTP_NO_CONTENT).send("No content");
      }
      if (!user.name) {
        res.status(HTTP_NO_CONTENT).send("No content");
      }
      if (!user.role) {
        res.status(HTTP_NO_CONTENT).send("No content");
      }
      if (!user.group) {
        res.status(HTTP_NO_CONTENT).send("No content");
      }

      const role = user.role.toLowerCase();
      if (roles.includes(role)) {
        res.status(HTTP_CONFLICT).send("Conflict");
      }
      roles.push(role);
    });

    if (roles.length !== roleList.length) {
      res.status(HTTP_CONFLICT).send("Conflict");
    }
  });

  await Group.deleteMany({ scenarioId });

  const output = [];
  const promises = groupList.map(async (userList) => {
    const group = await createGroup(scenarioId, userList);
    output.push(group);
  });

  await Promise.all(promises);

  res.status(HTTP_OK).json(output);
});

export default router;
