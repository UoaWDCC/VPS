import multer from "multer";
import { HttpStatusCode } from "axios";
import { HttpError } from "./error.js";

// Shared by everything that accepts a file upload, so a file is accepted or
// rejected the same way wherever it's uploaded.

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

/**
 * Express middleware that parses a single multipart `file` field into
 * `req.file`, turning multer's errors into HttpErrors.
 */
export function uploadWrapper(req, res, next) {
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

/**
 * Which kind of file a mime type is, as stored on UploadedFile and Asset.
 * @param {string} mimetype
 * @returns {"image" | "audio" | "document"}
 */
export function fileTypeFor(mimetype) {
  if (mimetype.startsWith("image/")) return "image";
  if (mimetype.startsWith("audio/")) return "audio";
  return "document";
}
