import { Router } from "express";
import mongoose from "mongoose";
import multer from "multer";
import auth from "../../middleware/firebaseAuth.js";
import CollectionGroup from "../../db/models/CollectionGroup.js";
import StoredFile from "../../db/models/StoredFile.js";
import {
  uploadBufferToGridFS,
  streamGridFsToResponse,
  deleteGridFsById,
} from "../../util/gridfs.js";

const router = Router();

// Allow ?token=ID_TOKEN for <img src> / links (copy to Authorization header)
router.use((req, _res, next) => {
  if (req.query && req.query.token && !req.headers.authorization) {
    req.headers.authorization = `Bearer ${req.query.token}`;
  }
  next();
});

/**
 * @route GET /api/files/download/:fileId
 * @desc Stream a file directly from GridFS by ID
 */
router.get("/download/:fileId", async (req, res) => {
  try {
    const { fileId } = req.params;
    const meta = await StoredFile.findById(fileId).lean();
    if (!meta) return res.status(404).json({ error: "File not found" });

    res.setHeader("Cache-Control", "no-store"); // avoid caching auth-protected content

    return streamGridFsToResponse({
      fileId: meta.gridFsId,
      res,
      contentType: meta.type,
      filename: meta.name,
      disposition: "inline",
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// All routes below require Firebase auth
router.use(auth);

// Upload configuration
const MAX_FILE_SIZE_MB = parseInt(process.env.MAX_FILE_SIZE_MB || "50", 10);
const ALLOWED_MIME_SET = new Set(
  (
    process.env.ALLOWED_MIME_LIST ||
    "image/png,image/jpeg,image/webp,application/pdf,text/plain,text/csv,application/json,text/markdown"
  )
    .split(",")
    .map((s) => s.trim())
);

// Multer (in-memory storage -> GridFS)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_SET.size > 0 && !ALLOWED_MIME_SET.has(file.mimetype)) {
      return cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
    cb(null, true);
  },
});

/**
 * Validate that group belongs to scenario
 */
async function assertGroupInScenario({ scenarioId, groupId }) {
  const group = await CollectionGroup.findById(groupId);
  if (!group) throw new Error("Group not found");
  if (String(group.scenarioId) !== String(scenarioId)) {
    throw new Error("groupId does not belong to scenarioId");
  }
}

/**
 * @route POST /api/files/upload
 * @desc Upload one or more files to a group within a scenario
 */
router.post("/upload", upload.array("files"), async (req, res) => {
  try {
    const { scenarioId, groupId } = req.body;
    if (!scenarioId || !groupId) {
      return res
        .status(400)
        .json({ error: "scenarioId and groupId are required" });
    }
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    const scenarioObjId = new mongoose.Types.ObjectId(scenarioId);
    const groupObjId = new mongoose.Types.ObjectId(groupId);

    await assertGroupInScenario({
      scenarioId: scenarioObjId,
      groupId: groupObjId,
    });

    const uploaderUid = req.user?.uid || "unknown";

    const results = [];
    for (const f of req.files) {
      const gridFsId = await uploadBufferToGridFS({
        filename: f.originalname,
        contentType: f.mimetype,
        buffer: f.buffer,
        metadata: { scenarioId, groupId, uploaderUid },
      });

      const doc = await StoredFile.create({
        scenarioId: scenarioObjId,
        groupId: groupObjId,
        name: f.originalname,
        size: f.size,
        type: f.mimetype,
        gridFsId,
        uploaderUid,
      });

      const ret = doc.toObject();
      delete ret.gridFsId;
      results.push(ret);
    }

    return res.status(201).json({ files: results });
  } catch (err) {
    if (err.message && err.message.startsWith("Unsupported file type")) {
      return res.status(415).json({ error: err.message });
    }
    if (err.message && err.message.includes("File too large")) {
      return res
        .status(413)
        .json({ error: `File exceeds ${MAX_FILE_SIZE_MB} MB` });
    }
    return res.status(500).json({ error: err.message || "Upload failed" });
  }
});

/**
 * @route DELETE /api/files/:fileId
 * @desc Delete a stored file and its GridFS data
 */
router.delete("/:fileId", async (req, res) => {
  try {
    const { fileId } = req.params;
    const meta = await StoredFile.findById(fileId);
    if (!meta) return res.status(404).json({ error: "File not found" });

    await deleteGridFsById(meta.gridFsId);
    await meta.deleteOne();

    return res.json({ deleted: 1 });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * @route POST /api/files/state-conditionals/:fileId
 * @desc Add a state conditional to a stored file
 */
router.post("/state-conditionals/:fileId", async (req, res) => {
  try {
    const { fileId } = req.params;
    const { stateConditional } = req.body;
    const meta = await StoredFile.findById(fileId);
    if (!meta) return res.status(404).json({ error: "File not found" });
    meta.stateConditionals.push(stateConditional);
    await meta.save();
    return res.json(meta);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * @route PUT /api/files/state-conditionals/:fileId
 * @desc Update a state conditional on a stored file
 */
router.put("/state-conditionals/:fileId", async (req, res) => {
  try {
    const { fileId } = req.params;
    const { stateConditional, stateConditionalIndex } = req.body;
    const meta = await StoredFile.findById(fileId);
    if (!meta) return res.status(404).json({ error: "File not found" });
    if (
      stateConditionalIndex < 0 ||
      stateConditionalIndex >= meta.stateConditionals.length
    ) {
      return res.status(400).json({ error: "Invalid stateConditionalIndex" });
    }
    meta.stateConditionals[stateConditionalIndex] = stateConditional;
    await meta.save();
    return res.json(meta);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * @route DELETE /api/files/state-conditionals/:fileId
 * @desc Delete a state conditional from a stored file
 */
router.delete("/state-conditionals/:fileId", async (req, res) => {
  try {
    const { fileId } = req.params;
    const { stateConditionalIndex } = req.body;
    const meta = await StoredFile.findById(fileId);
    if (!meta) return res.status(404).json({ error: "File not found" });
    if (
      stateConditionalIndex < 0 ||
      stateConditionalIndex >= meta.stateConditionals.length
    ) {
      return res.status(400).json({ error: "Invalid stateConditionalIndex" });
    }
    meta.stateConditionals.splice(stateConditionalIndex, 1);
    await meta.save();
    return res.json(meta);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
