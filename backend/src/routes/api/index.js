import { Router } from "express";

import scenario from "./scenario";

const router = Router();

router.use("/scenario", scenario);

export default router;
