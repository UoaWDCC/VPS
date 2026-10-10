import { Router } from "express";
import {
  retrieveUserByEmail,
  createUser,
  assignScenarioToUsers,
  getSeenResources,
  addSeenResources,
} from "../../db/daos/userDao.js";
import User from "../../db/models/user.js";
import Group from "../../db/models/group.js";
import auth from "../../middleware/firebaseAuth.js";

import STATUS from "../../util/status.js";
import { handle, HttpError } from "../../util/error.js";
import scenarioAuth from "../../middleware/scenarioAuth.js";
import { isValidObjectId } from "../../util/validation.js";

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

// get resource ids that user has seen
router.get(
  "/seen-resources/:scenarioId",
  handle(async (req, res) => {
    const { scenarioId } = req.params;
    const { uid } = req.body;

    if (!isValidObjectId(scenarioId)) {
      throw new HttpError("Invalid scenario ID", STATUS.BAD_REQUEST);
    }

    const seenResources = await getSeenResources(uid, scenarioId);

    return res.status(STATUS.OK).json({ seenResources });
  })
);

// mark resource ids as seen by the user
router.patch(
  "/seen-resources/:scenarioId",
  handle(async (req, res) => {
    const { scenarioId } = req.params;
    const { uid, resourceIds } = req.body;

    if (!isValidObjectId(scenarioId)) {
      throw new HttpError("Invalid scenario ID", STATUS.BAD_REQUEST);
    }

    if (
      !Array.isArray(resourceIds) ||
      !resourceIds.every((id) => typeof id === "string" && isValidObjectId(id))
    ) {
      throw new HttpError(
        "Resource IDs must be a valid ID string array",
        STATUS.BAD_REQUEST
      );
    }

    const seenResources = await addSeenResources(uid, scenarioId, resourceIds);

    return res.status(STATUS.OK).json({ seenResources });
  })
);

// NOTE: not currently used, but associated ui functionality will be added

// assign scenario to users
router.patch("/assigned/:scenarioId", scenarioAuth, async (req, res) => {
  const { userEmails } = req.body;
  const newAssigneeIds = Object.entries(
    await User.find({ email: { $in: userEmails } }, "_id")
  ).map(([_, userId]) => userId);

  await assignScenarioToUsers(req.params.scenarioId, newAssigneeIds);

  res.status(STATUS.OK).send();
});

export default router;
