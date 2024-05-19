import { Router } from "express";
import {
  retrieveAllUser,
  retrieveUserByEmail,
  createUser,
  retrieveUser,
  deleteUser,
  addPlayed,
  retrievePlayedUsers,
  assignScenarioToUsers,
} from "../../db/daos/userDao";
import User from "../../db/models/user";
import Group from "../../db/models/group";

const router = Router();

const HTTP_OK = 200;
const HTTP_NO_CONTENT = 204;
const HTTP_NOT_FOUND = 404;
const HTTP_CONFLICT = 409;

// gets all users
router.get("/", async (req, res) => {
  const dashboard = await retrieveAllUser();
  res.json(dashboard);
});

// get user by uid
router.get("/:uid", async (req, res) => {
  const user = await retrieveUser(req.params.uid);
  res.json(user);
});

// get users that played scenario
router.get("/played/:scenarioId", async (req, res) => {
  const users = await retrievePlayedUsers(req.params.scenarioId);
  return res.json(users);
});

// assign scenario to users
router.patch("/assigned/:scenarioId", async (req, res) => {
  const { userEmails } = req.body;
  const newAssigneeIds = Object.entries(
    await User.find({ email: { $in: userEmails } }, "_id")
    // eslint-disable-next-line no-unused-vars
  ).map(([_, userId]) => userId);

  await assignScenarioToUsers(req.params.scenarioId, newAssigneeIds);

  res.status(HTTP_OK);
});

// creats new user
router.post("/", async (req, res) => {
  const { name, uid, email, pictureURL } = req.body;

  const existingUser = await retrieveUserByEmail(email);
  if (existingUser) {
    res.status(HTTP_CONFLICT).json(existingUser);
    return;
  }

  const user = await createUser(name, uid, email, pictureURL);

  res.status(HTTP_OK).json(user);
});

// delete user by uid
router.delete("/:uid", async (req, res) => {
  const deleted = await deleteUser(req.params.uid);
  if (deleted) {
    res.sendStatus(HTTP_NO_CONTENT);
  } else {
    res.sendStatus(HTTP_NOT_FOUND);
  }
});

// update user's played array
router.put("/:uid", async (req, res) => {
  const scenarioID = Object.values(req.body)[0];
  const added = await addPlayed(req.params.uid, req.body, scenarioID);
  if (added) {
    res.status(HTTP_OK).json(added);
  } else {
    res.sendStatus(HTTP_NOT_FOUND);
  }
});

router.get("/:email/:scenarioId/group", async (req, res) => {
  const groups = await Group.find({ scenarioId: req.params.scenarioId });
  if (!groups.length) return res.json({ group: null });

  const group = await groups.find((g) =>
    g.users.find((u) => u.email === req.params.email)
  );
  if (!group) return res.json({ group: null });

  return res.json({
    group,
    current: group.path[group.path.length - 1],
  });
});

export default router;
