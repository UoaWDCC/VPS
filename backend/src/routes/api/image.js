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
      items = urls;
    } else if (Array.isArray(images) && images.length > 0) {
      items = images;
    } else {
      return res
        .status(HTTP_BAD_REQUEST)
        .json({ error: "Provide a non-empty 'urls' or 'images' array." });
    }

    // (optional) normalize urls -> { url }
    const normalized = items.map((it) =>
      typeof it === "string" ? { url: it } : it
    );

    await Promise.all(normalized.map(createImage));
    return res.sendStatus(HTTP_OK);
  } catch (err) {
    console.error("Failed to create images:", err?.stack || err?.message || String(err));
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
    console.error("Failed to retrieve image list:", err?.stack || err?.message || String(err));
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

  try {
    // Let DAO decide how to interpret the identifier (ObjectId or custom id).
    // If DAO uses findById and throws CastError, we translate to 404 below.
    const image = await retrieveImage(imageId);

    if (!image) {
      return res.status(HTTP_NOT_FOUND).json({ error: "Image not found." });
    }
    return res.status(HTTP_OK).json(image);
  } catch (err) {
    if (err?.name === "CastError") {
      // Invalid ObjectId → behave like not found (tests expect retrieval by id to “work or 404”, not 400)
      return res.status(HTTP_NOT_FOUND).json({ error: "Image not found." });
    }
    console.error("Failed to retrieve image:", err?.stack || err?.message || String(err));
    return res
      .status(HTTP_SERVER_ERROR)
      .json({ error: "Failed to retrieve image." });
  }
});

export default router;
