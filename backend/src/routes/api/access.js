import { Router } from "express";
import {
  getAccessList,
  grantAccess,
  revokeAccess,
} from "../../db/daos/accessDao.js";
import auth from "../../middleware/firebaseAuth.js";
import { scenarioOwnerAuth } from "../../middleware/scenarioAuth.js";
import { HttpStatusCode } from "axios";
import { isValidEmail } from "../../util/email.js";
import { normaliseString } from "../../util/normalise.js";
import { handle, HttpError } from "../../util/error.js";

// NOTE: these operations are locked to only the scenario owner

const router = Router();

router.use(auth);
router.use("/:scenarioId", scenarioOwnerAuth);

// get the access list
router.get(
  "/:scenarioId",
  handle(async (req, res) => {
    const { scenarioId } = req.params;
    const access = await getAccessList(scenarioId);
    return res.json(access);
  })
);

// add a user to the access list
router.patch(
  "/:scenarioId/grant",
  handle(async (req, res) => {
    const { scenarioId } = req.params;
    const email = normaliseString(req.body.email);
    if (!email || !isValidEmail(email))
      throw new HttpError(
        "email format is not valid",
        HttpStatusCode.BadRequest
      );

    const access = await grantAccess(scenarioId, email);
    return res.json(access);
  })
);

// remove a user from the access list
router.patch(
  "/:scenarioId/revoke",
  handle(async (req, res) => {
    const { scenarioId } = req.params;
    const { emails } = req.body;

    if (!Array.isArray(emails) || emails.length === 0)
      throw new HttpError(
        "emails must be a non-empty array",
        HttpStatusCode.BadRequest
      );

    const normd = emails.map((email) => {
      const normd = normaliseString(email);
      return normd && isValidEmail(normd) ? normd : null;
    });

    if (normd.some(!Boolean))
      throw new HttpError(
        "email format is not valid",
        HttpStatusCode.BadRequest
      );

    const access = await revokeAccess(scenarioId, normd);
    if (!access)
      throw new HttpError(
        "access object not found for scenario",
        HttpStatusCode.NotFound
      );
    return res.json(access);
  })
);

export default router;
