import { Router } from "express";

import scenario from "./scenario";
import image from "./image";
import staff from "./staff";

const router = Router();

router.use("/scenario", scenario);
router.use("/image", image);
router.use("/staff", staff);

export default router;
