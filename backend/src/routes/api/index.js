import { Router } from "express";

import scenario from "./scenario";
import image from "./image";

const router = Router();

router.use("/scenario", scenario);
router.use("/image", image);

export default router;
