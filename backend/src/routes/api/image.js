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

/**
 * POST /images
 * Accepts either:
 *  - { urls: ["https://...", "..."] }
 *  - { images: [{ id, url, fileName, uploadedAt }, ...] }
 */
router.post("/", async (req, res) => {
  try {
    const { urls, images } = req.body || {};

    let items = null;
    if (Array.isArray(urls) && urls.length > 0) {
      items = urls; // createImage will receive each url
    } else if (Array.isArray(images) && images.length > 0) {
      items = images; // createImage will receive each image object
    } else {
      return res
        .status(HTTP_BAD_REQUEST)
        .json({ error: "Provide a non-empty 'urls' or 'images' array." });
    }

    await Promise.all(items.map(createImage));
    return res.sendStatus(HTTP_OK);
  } catch (err) {
    console.error("Failed to create images:", err);
    return res
      .status(HTTP_SERVER_ERROR)
      .json({ error: "Failed to create images." });
  }
});

// GET /images — retrieve all images
router.get("/", async (_req, res) => {
  try {
    const images = await retrieveImageList();
    return res.status(HTTP_OK).json(images);
  } catch (err) {
    console.error("Failed to retrieve image list:", err);
    return res
      .status(HTTP_SERVER_ERROR)
      .json({ error: "Failed to retrieve image list." });
  }
});

// GET /images/:imageId — retrieve single image
router.get("/:imageId", async (req, res) => {
  const { imageId } = req.params;

  if (!imageId || imageId === "undefined") {
    return res
      .status(HTTP_BAD_REQUEST)
      .json({ error: "Invalid or missing image ID." });
  }

  if (!mongoose.Types.ObjectId.isValid(imageId)) {
    return res
      .status(HTTP_BAD_REQUEST)
      .json({ error: "Invalid image ID format." });
  }

  try {
    const image = await retrieveImage(imageId);
    if (!image) {
      return res.status(HTTP_NOT_FOUND).json({ error: "Image not found." });
    }
    return res.status(HTTP_OK).json(image);
  } catch (err) {
    console.error("Failed to retrieve image:", err);
    return res
      .status(HTTP_SERVER_ERROR)
      .json({ error: "Failed to retrieve image." });
  }
});

export default router;
