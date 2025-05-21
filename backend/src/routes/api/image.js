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
  const { images } = req.body; // expects: [{ id, url, fileName, uploadedAt }, ...]

  if (!Array.isArray(images) || images.length === 0) {
    return res.status(400).json({ error: "No images provided" });
  }

  try {
    await Promise.all(images.map(createImage));
    res.status(HTTP_OK).send();
  } catch (err) {
    console.error("Error saving images:", err);
    res.status(500).json({ error: "Failed to save images" });
  }
});

// retrieve all database images
router.get("/", async (req, res) => {
  const images = await retrieveImageList();

  res.status(HTTP_OK).json(images);
});

// retrieve a single image by ID
router.get("/:imageId", async (req, res) => {
  const { imageId } = req.params;

  if (!imageId || imageId === "undefined") {
    return res.status(400).json({ error: "Invalid or missing image ID" });
  }

  try {
    const image = await retrieveImage(imageId);
    if (!image) {
      return res.status(404).json({ error: "Image not found" });
    }
    res.status(HTTP_OK).json(image);
  } catch (err) {
    console.error("Error fetching image:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
