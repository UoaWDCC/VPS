import { Router } from "express";

import {
  getCurrentScene,
  getGroup,
  createGroup,
  getGroupByScenarioId,
} from "../../db/daos/groupDao";

import { retrieveRoleList, updateRoleList } from "../../db/daos/scenarioDao";
import Group from "../../db/models/group";

const router = Router();

const HTTP_OK = 200;
const HTTP_CONFLICT = 409;
const HTTP_NO_CONTENT = 204;
const HTTP_NOT_FOUND = 404;

// get the groups assigned to a scenario
router.get("/scenario/:scenarioId", async (req, res) => {
  try {
    const { scenarioId } = req.params;
    const groups = await getGroupByScenarioId(scenarioId);
    return res.status(HTTP_OK).json(groups);
  } catch (error) {
    return res.status(HTTP_NOT_FOUND).json({ error: error.message });
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
        res
          .status(HTTP_CONFLICT)
          .send("Conflict - Duplicate roles in the same group!");
      }
      roles.push(role);
    });

    if (roles.length !== roleList.length) {
      res.status(HTTP_CONFLICT).send("Conflict - Different number of roles!");
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

router.get("/:scenarioId/roleList", async (req, res) => {
  const { scenarioId } = req.params;

  const roleList = await retrieveRoleList(scenarioId);

  res.status(HTTP_OK).json(roleList);
});

// get a group by its id
router.get("/retrieve/:groupId", async (req, res) => {
  const { groupId } = req.params;
  const group = await getGroup(groupId);
  if (!group) {
    return res.status(HTTP_NOT_FOUND).json({ error: "Group not found" });
  }
  return res.status(HTTP_OK).json(group);
});

export default router;
