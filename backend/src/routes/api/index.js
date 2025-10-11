import { Router } from "express";

import scenario from "./scenario.js";
import image from "./image.js";
import staff from "./staff.js";
import note from "./note.js";
import user from "./user.js";
import group from "./group.js";
import resource from "./resources.js";
import navigate from "./navigate/index.js";
import access from "./access.js"
const router = Router();

router.use("/scenario", scenario);
router.use("/image", image);
router.use("/staff", staff);
router.use("/user", user);
router.use("/note", note);
router.use("/group", group);
router.use("/navigate", navigate);
router.use("/resources", resource);
router.use("/access", access)

export default router;
