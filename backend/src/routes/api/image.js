import { Router } from "express";

import { createImage } from "../../db/daos/imageDao";

const router = Router();

const HTTP_OK = 200;

router.post("/", async (req, res) => {
  const urls = req.body.urls;
  urls.forEach((url) => createImage(url));

  res.status(HTTP_OK).json("received");
});

export default router;
