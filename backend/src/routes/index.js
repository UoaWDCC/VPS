import { Router } from "express";

const router = Router();

router.use("/scenario", require("./api/scenario"));

export default router;
