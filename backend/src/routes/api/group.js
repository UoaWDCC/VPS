import { Router } from "express";

import { addSceneToPath, createGroup } from "../../db/daos/groupDao";
import { updateRoleList } from "../../db/daos/scenarioDao";
import Group from "../../db/models/group";

const router = Router();

const HTTP_OK = 200;
const HTTP_CONFLICT = 409;
const HTTP_NO_CONTENT = 204;

// add a scene to the group's shared path
router.post("/path/:groupId", async (req, res) => {
  const { currentSceneId, nextSceneId } = req.body;
  const { groupId } = req.params;

  try {
    await addSceneToPath(groupId, currentSceneId, nextSceneId);
    return res.status(HTTP_OK).json("Scene added to path");
  } catch (error) {
    return res
      .status(HTTP_CONFLICT)
      .json({ error: "Scene mismatch b/w client and server" });
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
