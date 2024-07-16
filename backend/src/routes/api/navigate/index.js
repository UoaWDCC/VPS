import { Router } from "express";
import auth from "../../../middleware/firebaseAuth";

import handle from "../../../error/handle";
import groupNavigate from "./group";
import userNavigate from "./user";

const router = Router();

router.use(auth);

router.post(
  "/group/:groupId",
  handle(async (req, res) => {
    const response = await groupNavigate(req);
    return res.status(response.status).json(response.json);
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
