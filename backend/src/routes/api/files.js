import { Router } from "express";
import multer from "multer";
import auth from "../../middleware/firebaseAuth.js";
import { HttpStatusCode } from "axios";
import { uploadFile } from "../../firebase/storage.js";
import UploadedFile from "../../db/models/uploadedFile.js";
import { handle, HttpError } from "../../util/error.js";

const router = Router();

router.use(auth);

// multer config (in-memory storage)
const MAX_FILE_SIZE_MB = parseInt(process.env.MAX_FILE_SIZE_MB || "10", 10);
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
  limits: { fileSize: MAX_FILE_SIZE_MB * 1024 * 1024 },
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

router.post(
  "/upload",
  upload.single("file"),
  handle(async (req, res) => {
    try {
      if (!req.file)
        throw new HttpError("no file provided", HttpStatusCode.BadRequest);

      const firebaseInfo = await uploadFile(req.file.buffer, req.file.mimetype);

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
        scenarioId: req.body.scenarioId,
        deletedAt: Date.now(), // handle orphanage from interruption between upload and reference
      });

      return res.status(201).json(uploadedFile);
    } catch (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        throw new HttpError(err.message, HttpStatusCode.PayloadTooLarge);
      } else throw err;
    }
  })
);

export default router;
