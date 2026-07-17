import { Router } from "express";
import multer from "multer";
import auth from "../../middleware/firebaseAuth.js";
import { HttpStatusCode } from "axios";
import { deleteFile, uploadFile } from "../../firebase/storage.js";
import UploadedFile from "../../db/models/uploadedFile.js";
import { handle, HttpError } from "../../util/error.js";
import { retrieveFile, retrieveFiles } from "../../db/daos/fileDao.js";
import scenarioAuth from "../../middleware/scenarioAuth.js";
import { isValidObjectId } from "../../util/validation.js";

const router = Router();

router.use(auth);
router.use("/:scenarioId", scenarioAuth);

// multer config (in-memory storage)
const parsedMaxFileSizeMb = parseFloat(process.env.MAX_FILE_SIZE_MB);
const MAX_FILE_SIZE_MB = Number.isFinite(parsedMaxFileSizeMb)
  ? parsedMaxFileSizeMb
  : 10;
const MAX_FILE_SIZE_BYTES = Math.floor(MAX_FILE_SIZE_MB * 1024 * 1024);

const ALLOWED_MIME_SET = new Set(
  (
    process.env.ALLOWED_MIME_LIST ||
    "image/png,image/jpeg,image/webp,image/gif,application/pdf,text/plain,text/markdown,audio/mpeg,audio/wav,audio/ogg,audio/webm,audio/mp4,audio/aac"
  )
    .split(",")
    .map((s) => s.trim())
);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_SET.size > 0 && !ALLOWED_MIME_SET.has(file.mimetype)) {
      return cb(
        new HttpError(
          `unsupported file type: ${file.mimetype}`,
          HttpStatusCode.UnsupportedMediaType
        )
      );
    }
    cb(null, true);
  },
});

function uploadWrapper(req, res, next) {
  upload.single("file")(req, res, (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE")
        return next(new HttpError(err.message, HttpStatusCode.PayloadTooLarge));
      if (
        err instanceof multer.MulterError ||
        err.message === "Unexpected end of form"
      )
        return next(
          new HttpError("malformed upload", HttpStatusCode.BadRequest)
        );
      return next(err);
    }
    next();
  });
}

// POST /files/:scenarioId — upload a file to a scenario
router.post(
  "/:scenarioId",
  uploadWrapper,
  handle(async (req, res) => {
    if (!req.file)
      throw new HttpError("no file provided", HttpStatusCode.BadRequest);

    const firebaseInfo = await uploadFile(req.file.buffer, req.file.mimetype);

    try {
      const type = req.file.mimetype.startsWith("image/")
        ? "image"
        : req.file.mimetype.startsWith("audio/")
          ? "audio"
          : "document";

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

// GET /files/:scenarioId/images — retrieve all images in scenario
router.get(
  "/:scenarioId/:type",
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
