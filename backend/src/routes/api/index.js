import { Router } from "express";

import scenario from "./scenario";
import image from "./image";
import user from "./user";

const router = Router();

router.use("/scenario", scenario);
router.use("/image", image);
router.use("/user", user);

export default router;
