import { Router } from "express";

import { retrieveImage, retrieveImageList } from "../../db/daos/imageDao.js";
import auth from "../../middleware/firebaseAuth.js";
import { handle, HttpError } from "../../util/error.js";
import scenarioAuth from "../../middleware/scenarioAuth.js";
import { HttpStatusCode } from "axios";

const router = Router();

router.use(auth);
router.use("/:scenarioId", scenarioAuth);

/**
 * POST /images
 * Accepts either:
 *  - { urls: ["https://...", "..."] }
 *  - { images: [{ id, url, fileName, uploadedAt }, ...] }
 */
// router.post("/", async (req, res) => {
//   try {
//     const { urls, images } = req.body || {};
//
//     let items = null;
//     if (Array.isArray(urls) && urls.length > 0) {
//       items = urls;
//     } else if (Array.isArray(images) && images.length > 0) {
//       items = images;
//     } else {
//       return res
//         .status(HTTP_BAD_REQUEST)
//         .json({ error: "Provide a non-empty 'urls' or 'images' array." });
//     }
//
//     // (optional) normalize urls -> { url }
//     const normalized = items.map((it) =>
//       typeof it === "string" ? { url: it } : it
//     );
//
//     await Promise.all(normalized.map(createImage));
//     return res.sendStatus(HTTP_OK);
//   } catch (err) {
//     console.error(
//       "Failed to create images:",
//       err?.stack || err?.message || String(err)
//     );
//     return res
//       .status(HTTP_SERVER_ERROR)
//       .json({ error: "Failed to create images." });
//   }
// });

// GET /images/:scenarioId — retrieve all images in scenario
router.get(
  "/:scenarioId",
  handle(async (req, res) => {
    const { scenarioId } = req.params;
    const images = await retrieveImageList(scenarioId);
    return res.json(images);
  })
);

// GET /images/:imageId — retrieve single image
router.get(
  "/:imageId",
  handle(async (req, res) => {
    const { imageId } = req.params;
    if (!imageId)
      throw new HttpError(
        "invalid or missing image id",
        HttpStatusCode.BadRequest
      );
    const image = await retrieveImage(imageId);
    if (!image) throw new HttpError("image not found", HttpStatusCode.NotFound);
    return res.json(image);
  })
);

export default router;
