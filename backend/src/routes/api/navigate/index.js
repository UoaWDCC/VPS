import { Router } from "express";
import auth from "../../../middleware/firebaseAuth.js";

import { handle } from "../../../util/error.js";
import { groupNavigate, groupReset, groupGetResources } from "./group.js";
import { userNavigate, userReset } from "./user.js";

const router = Router();

router.use(auth);

router.post(
  "/group/reset/:groupId",
  handle(async (req, res) => {
    const response = await groupReset(req);
    return res.status(response.status).send();
  })
);

router.post(
  "/group/:groupId",
  handle(async (req, res) => {
    const response = await groupNavigate(req);
    return res.status(response.status).json(response.json);
  })
);

router.get(
  "/group/resources/:groupId",
  handle(async (req, res) => {
    const response = await groupGetResources(req);
    return res.status(response.status).json(response.json);
  })
);

router.post(
  "/user/reset/:scenarioId",
  handle(async (req, res) => {
    const response = await userReset(req);
    return res.status(response.status).send();
  })
);

router.post(
  "/user/:scenarioId",
  handle(async (req, res) => {
    const response = await userNavigate(req);
    return res.status(response.status).json(response.json);
  })
);

export default router;
