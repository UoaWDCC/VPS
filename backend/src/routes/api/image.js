import { Router } from "express";

import {
  createImage,
  retrieveImage,
  retrieveImageList,
} from "../../db/daos/imageDao.js";

const router = Router();

const HTTP_OK = 200;

// add an image to the database
router.post("/", async (req, res) => {
  const { urls } = req.body;
  await Promise.all(urls.map(createImage));
  res.status(HTTP_OK).send();
});

// retrieve all database images
router.get("/", async (req, res) => {
  const images = await retrieveImageList();

  res.status(HTTP_OK).json(images);
});

// retrieve a single image by ID
router.get("/:imageId", async (req, res) => {
  const image = await retrieveImage(req.params.imageId);
  res.status(HTTP_OK).json(image);
});

export default router;
