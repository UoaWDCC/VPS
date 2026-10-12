import { Router } from "express";
import { HttpStatusCode } from "axios";
import auth from "../../middleware/firebaseAuth.js";
import { isAuthor } from "../../middleware/scenarioAuth.js";
import { deleteFile, uploadFile } from "../../firebase/storage.js";
import Asset, { ASSET_NAME_MAX_LENGTH } from "../../db/models/asset.js";
import {
  listAssets,
  removeAsset,
  retrieveOwnedAsset,
  useAssetInScenario,
} from "../../db/daos/assetDao.js";
import { handle, HttpError } from "../../util/error.js";
import { parseTags, normaliseTags } from "../../util/tags.js";
import { fileTypeFor, uploadWrapper } from "../../util/upload.js";
import { isValidObjectId } from "../../util/validation.js";

const router = Router();

router.use(auth);

const VALID_TYPES = ["image", "audio", "document"];

function assertValidAssetId(assetId) {
  if (!isValidObjectId(assetId))
    throw new HttpError("invalid asset id", HttpStatusCode.BadRequest);
}

async function ownedAssetOrThrow(assetId, uid) {
  assertValidAssetId(assetId);
  const asset = await retrieveOwnedAsset(assetId, uid);
  if (!asset) throw new HttpError("asset not found", HttpStatusCode.NotFound);
  return asset;
}

function cleanName(raw) {
  return typeof raw === "string"
    ? raw.trim().slice(0, ASSET_NAME_MAX_LENGTH)
    : "";
}

/**
 * @route GET /api/assets
 * @desc The caller's library, newest first. Optional filters: type, tag, q
 * (search words matched against name and tags) and limit.
 */
router.get(
  "/",
  handle(async (req, res) => {
    const { type, tag, q, limit } = req.query;

    if (type !== undefined && !VALID_TYPES.includes(type))
      throw new HttpError("invalid asset type", HttpStatusCode.BadRequest);

    const assets = await listAssets(req.uid, {
      type,
      tag: typeof tag === "string" ? normaliseTags(tag)[0] : undefined,
      q: typeof q === "string" ? q : undefined,
      limit,
    });
    return res.json(assets);
  })
);

/**
 * @route POST /api/assets
 * @desc Upload a file to the caller's library. Multipart: `file`, and
 * optionally `tags` (comma separated) and `name` (defaults to the file name).
 */
router.post(
  "/",
  uploadWrapper,
  handle(async (req, res) => {
    if (!req.file)
      throw new HttpError("no file provided", HttpStatusCode.BadRequest);

    const tags = parseTags(req.body.tags);
    const name = cleanName(req.body.name) || cleanName(req.file.originalname);
    if (!name) throw new HttpError("missing name", HttpStatusCode.BadRequest);

    const firebaseInfo = await uploadFile(req.file.buffer, req.file.mimetype);

    try {
      const asset = await Asset.create({
        name,
        type: fileTypeFor(req.file.mimetype),
        tags,
        path: firebaseInfo.path,
        url: firebaseInfo.url,
        contentType: req.file.mimetype,
        size: req.file.size,
        ownerUid: req.uid,
      });
      return res.status(201).json(asset);
    } catch (err) {
      try {
        await deleteFile(firebaseInfo.path);
      } catch (cleanupErr) {
        err.cleanupErr = cleanupErr;
      }
      throw err;
    }
  })
);

/**
 * @route PATCH /api/assets/:assetId
 * @desc Rename an asset and/or replace its tags
 */
router.patch(
  "/:assetId",
  handle(async (req, res) => {
    const asset = await ownedAssetOrThrow(req.params.assetId, req.uid);
    const { name, tags } = req.body;

    if (name === undefined && tags === undefined)
      throw new HttpError("nothing to update", HttpStatusCode.BadRequest);

    if (name !== undefined) {
      const trimmed = cleanName(name);
      if (!trimmed)
        throw new HttpError("missing name", HttpStatusCode.BadRequest);
      asset.name = trimmed;
    }
    if (tags !== undefined) asset.tags = parseTags(tags);

    await asset.save();
    return res.json(asset);
  })
);

/**
 * @route DELETE /api/assets/:assetId
 * @desc Remove an asset from the caller's library. The stored file is only
 * deleted if no scenario is using it.
 */
router.delete(
  "/:assetId",
  handle(async (req, res) => {
    assertValidAssetId(req.params.assetId);
    const { removed, storageStillUsed } = await removeAsset(
      req.params.assetId,
      req.uid
    );
    if (!removed)
      throw new HttpError("asset not found", HttpStatusCode.NotFound);

    if (!storageStillUsed) {
      try {
        await deleteFile(removed.path);
      } catch (err) {
        // the entry is gone either way; a leftover blob is only wasted space
        console.error("failed to delete stored asset file", err);
      }
    }
    return res.status(HttpStatusCode.NoContent).send();
  })
);

/**
 * @route POST /api/assets/:assetId/use
 * @desc Make an asset available in a scenario the caller can edit. Answers
 * with the scenario's UploadedFile for it, which scenes reference as usual.
 * Asking again for the same scenario gives the same file.
 */
router.post(
  "/:assetId/use",
  handle(async (req, res) => {
    const asset = await ownedAssetOrThrow(req.params.assetId, req.uid);

    const { scenarioId } = req.body;
    if (!isValidObjectId(scenarioId))
      throw new HttpError("invalid scenario id", HttpStatusCode.BadRequest);
    if (!(await isAuthor(scenarioId, req.uid)))
      throw new HttpError("unauthorised", HttpStatusCode.Unauthorized);

    const { file, created } = await useAssetInScenario(asset, scenarioId);
    return res.status(created ? 201 : 200).json(file);
  })
);

export default router;
