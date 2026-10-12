import { Router } from "express";
import auth from "../../middleware/firebaseAuth.js";
import { HttpStatusCode } from "axios";
import { deleteFile, uploadFile } from "../../firebase/storage.js";
import UploadedFile from "../../db/models/uploadedFile.js";
import { handle, HttpError } from "../../util/error.js";
import { retrieveFile, retrieveFiles } from "../../db/daos/fileDao.js";
import scenarioAuth from "../../middleware/scenarioAuth.js";
import { isValidObjectId } from "../../util/validation.js";
import { fileTypeFor, uploadWrapper } from "../../util/upload.js";

const router = Router();

router.use(auth);
router.use("/:scenarioId", scenarioAuth);

// POST /files/:scenarioId — upload a file to a scenario
router.post(
  "/:scenarioId",
  uploadWrapper,
  handle(async (req, res) => {
    if (!req.file)
      throw new HttpError("no file provided", HttpStatusCode.BadRequest);

    const firebaseInfo = await uploadFile(req.file.buffer, req.file.mimetype);

    try {
      const type = fileTypeFor(req.file.mimetype);

      const uploadedFile = await UploadedFile.create({
        name: req.file.originalname,
        type: type,
        path: firebaseInfo.path,
        url: firebaseInfo.url,
        contentType: req.file.mimetype,
        size: req.file.size,
        uploaderUid: req.uid,
        scenarioId: req.params.scenarioId,
        orphanedAt: Date.now(), // handle orphanage from interruption between upload and reference
      });

      return res.status(201).json(uploadedFile);
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

const VALID_TYPES = ["image", "audio", "document"];

// GET /files/:scenarioId/type/:type — retrieve all files of a given type in scenario
router.get(
  "/:scenarioId/type/:type",
  handle(async (req, res) => {
    const { scenarioId, type } = req.params;
    if (!VALID_TYPES.includes(type))
      throw new HttpError("invalid file type", HttpStatusCode.BadRequest);
    const files = await retrieveFiles(scenarioId, type);
    return res.json(files);
  })
);

// GET /files/:scenarioId/:fileId — retrieve single file
router.get(
  "/:scenarioId/:fileId",
  handle(async (req, res) => {
    const { scenarioId, fileId } = req.params;
    if (!fileId || !isValidObjectId(fileId))
      throw new HttpError(
        "invalid or missing file id",
        HttpStatusCode.BadRequest
      );
    const uploadedFile = await retrieveFile(scenarioId, fileId);
    if (!uploadedFile)
      throw new HttpError("file not found", HttpStatusCode.NotFound);
    return res.json(uploadedFile);
  })
);

export default router;
