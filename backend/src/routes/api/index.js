import { Router } from "express";

import scenario from "./scenario";
import image from "./image";
import Dashboard from "./dashboard";

const router = Router();

router.use("/scenario", scenario);
router.use("/image", image);
router.use("/dashboard", Dashboard);

export default router;
