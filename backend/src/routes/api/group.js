import { Router } from "express";
import {
  createGroup,
  getCurrentScene,
  getGroup,
  getGroupByScenarioId,
} from "../../db/daos/groupDao.js";

import { retrieveRoleList, updateRoleList } from "../../db/daos/scenarioDao.js";
import Group from "../../db/models/group.js";

import validScenarioId from "../../middleware/validScenarioId.js";

const router = Router();

const HTTP_OK = 200;
const HTTP_BAD_REQUEST = 400;
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

router.use("/:scenarioId", validScenarioId);
// create a new group
router.post("/:scenarioId", async (req, res) => {
  const { groupList, roleList } = req.body;
  const { scenarioId } = req.params;

  // check for scenario role list
  // if it doesn't exist, create it
  await updateRoleList(scenarioId, roleList);

  // validation
  for (const userList of groupList) {
    if (!userList) {
      return res.status(HTTP_BAD_REQUEST).send("No user list found");
    }

    const roles = [];
    for (const user of userList) {
      if (!user.email || !user.name || !user.role || !user.group) {
        return res
          .status(HTTP_BAD_REQUEST)
          .send("All users must have a name, email, role and group");
      }

      const role = user.role.toLowerCase();
      if (roles.includes(role)) {
        return res
          .status(HTTP_BAD_REQUEST)
          .send("All students must have different roles in a group");
      }
      roles.push(role);
    }

    if (roles.length !== roleList.length) {
      return res.status(HTTP_BAD_REQUEST).send("Each group must use all roles");
    }
  }

  await Group.deleteMany({ scenarioId });

  const output = [];
  const promises = groupList.map(async (userList) => {
    const group = await createGroup(scenarioId, userList);
    output.push(group);
  });

  await Promise.all(promises);

  return res.status(HTTP_OK).json(output);
});

router.get("/:scenarioId/roleList", async (req, res) => {
  const { scenarioId } = req.params;
  const roleList = await retrieveRoleList(scenarioId);

  res.status(HTTP_OK).json(roleList);
});
