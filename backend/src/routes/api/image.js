import { Router } from "express";
import mongoose from "mongoose";

import {
  createImage,
  retrieveImage,
  retrieveImageList,
} from "../../db/daos/imageDao.js";

const router = Router();
const HTTP_OK = 200;
const HTTP_BAD_REQUEST = 400;
const HTTP_NOT_FOUND = 404;
const HTTP_SERVER_ERROR = 500;

// Add images to the database
router.post("/", async (req, res) => {
  try {
    const { urls } = req.body;
    await Promise.all(urls.map(createImage));
    res.status(HTTP_OK).send();
  } catch (err) {
    console.error("Failed to create images:", err);
    res.status(HTTP_SERVER_ERROR).json({ error: "Failed to create images." });
  }
});

// Retrieve all database images
router.get("/", async (req, res) => {
  try {
    const images = await retrieveImageList();
    res.status(HTTP_OK).json(images);
  } catch (err) {
    console.error("Failed to retrieve image list:", err);
    res.status(HTTP_SERVER_ERROR).json({ error: "Failed to retrieve image list." });
  }
});

// Retrieve a single image by ID
router.get("/:imageId", async (req, res) => {
  const { imageId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(imageId)) {
    return res.status(HTTP_BAD_REQUEST).json({ error: "Invalid image ID format." });
  }

  try {
    const image = await retrieveImage(imageId);

    if (!image) {
      return res.status(HTTP_NOT_FOUND).json({ error: "Image not found." });
    }

    res.status(HTTP_OK).json(image);
  } catch (err) {
    console.error("Failed to retrieve image:", err);
    res.status(HTTP_SERVER_ERROR).json({ error: "Failed to retrieve image." });
  }
});

export default router;
