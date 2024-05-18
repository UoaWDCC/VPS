import { Router } from "express";

import scenario from "./scenario";
import image from "./image";
import staff from "./staff";
import note from "./note";
import user from "./user";
import group from "./group";

const router = Router();

router.use("/scenario", scenario);
router.use("/image", image);
router.use("/staff", staff);
router.use("/user", user);
router.use("/note", note);
router.use("/group", group);

export default router;
