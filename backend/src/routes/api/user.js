import { Router } from "express";
import {
  retrieveAllUser,
  retrieveUserByEmail,
  createUser,
  retrieveUser,
  addPlayed,
  retrievePlayedUsers,
  assignScenarioToUsers,
  retrieveAllUserMinAsc,
} from "../../db/daos/userDao.js";
import User from "../../db/models/user.js";
import Group from "../../db/models/group.js";
import auth from "../../middleware/firebaseAuth.js";

import STATUS from "../../util/status.js";
import { handle, HttpError } from "../../util/error.js";

const router = Router();

const allowedDomains = new Set([
  "projects.wdcc.co.nz",
  "auckland.ac.nz",
  "aucklanduni.ac.nz",
]);

const allowedEmails = new Set([
  "wdccvpstesting1@gmail.com",
  "wdccvpstesting2@gmail.com",
  "wdccvpstesting3@gmail.com",
  "wdccvpstesting4@gmail.com",
]);

// Sign-in: public — unauthenticated users call this to register/log in
router.post(
  "/",
  handle(async (req, res) => {
    const email = req?.body?.email || "";
    if (
      email.split("@").length <= 1 ||
      (!allowedDomains.has(email.split("@")[1]) && !allowedEmails.has(email))
    ) {
      throw new HttpError("Sign in with your UoA account", STATUS.FORBIDDEN);
    }
    if (!(await retrieveUserByEmail(req.body.email))) {
      await createUser(req.body);
    }
    res.status(STATUS.OK).send();
  })
);

// All routes below require Firebase authentication
router.use(auth);

// gets all users
router.get("/", async (req, res) => {
  const dashboard = await retrieveAllUser();
  res.json(dashboard);
});

// Only gets the uid, name and email.
router.get("/min", async (req, res) => {
  const users = await retrieveAllUserMinAsc();
  res.json(users);
});

// fetch the user's group needed for a scenario upfront
router.get(
  "/group/:scenarioId",
  handle(async (req, res) => {
    const { scenarioId } = req.params;
    const { uid } = req.body;
    const user = await User.findOne({ uid }, { email: 1 }).lean();
    if (!user) throw new HttpError("User not found", STATUS.UNAUTHORIZED);
    const group = await Group.findOne({
      scenarioId,
      "users.email": user.email,
    });
    return res.status(STATUS.OK).json({ group });
  })
);

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

  res.status(STATUS.OK).send();
});

// get user by uid
router.get("/:uid", async (req, res) => {
  const user = await retrieveUser(req.params.uid);
  res.json(user);
});


// update user's played array
router.put("/:uid", async (req, res) => {
  const scenarioID = Object.values(req.body)[0];
  const added = await addPlayed(req.params.uid, req.body, scenarioID);
  if (added) {
    res.status(STATUS.OK).json(added);
  } else {
    res.sendStatus(STATUS.NOT_FOUND);
  }
});

// add a scene to the user's path
router.post("/:uid/:scenarioId/path", async (req, res) => {
  const { nextSceneId } = req.body;
  const { uid, scenarioId } = req.params;

  await User.findOneAndUpdate(
    { uid },
    {
      $push: {
        [`paths.${scenarioId}`]: { $each: [nextSceneId], $position: 0 },
      },
    }
  );

  res.sendStatus(STATUS.OK);
});

export default router;
