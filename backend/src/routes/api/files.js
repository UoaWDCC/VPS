import { Router } from "express";
import mongoose from "mongoose";
import multer from "multer";
import auth from "../../middleware/firebaseAuth.js";
import CollectionGroup from "../../db/models/CollectionGroup.js";
import CollectionChild from "../../db/models/CollectionChild.js";
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

router.use(auth);

// Configurable constraints
const MAX_FILE_SIZE_MB = parseInt(process.env.MAX_FILE_SIZE_MB || "50", 10);
const ALLOWED_MIME_SET = new Set(
  (
    process.env.ALLOWED_MIME_LIST ||
    // sane defaults for docs/images/text
    "image/png,image/jpeg,image/webp,application/pdf,text/plain,text/csv,application/json,text/markdown"
  )
    .split(",")
    .map((s) => s.trim())
);

// Multer memory storage; we write bytes to GridFS
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

// Ensure the group/child mapping is valid for the scenario
async function assertHierarchy({ scenarioId, groupId, childId }) {
  const [group, child] = await Promise.all([
    CollectionGroup.findById(groupId),
    CollectionChild.findById(childId),
  ]);
  if (!group) throw new Error("Group not found");
  if (String(group.scenarioId) !== String(scenarioId)) {
    throw new Error("groupId does not belong to scenarioId");
  }
  if (!child) throw new Error("Child not found");
  if (
    String(child.groupId) !== String(groupId) ||
    String(child.scenarioId) !== String(scenarioId)
  ) {
    throw new Error("childId does not belong to groupId/scenarioId");
  }
}

// POST /api/files/upload (multipart)
// fields: scenarioId, groupId, childId; files: one or many ("files")
router.post("/upload", upload.array("files"), async (req, res) => {
  try {
    const { scenarioId, groupId, childId } = req.body;
    if (!scenarioId || !groupId || !childId) {
      return res
        .status(400)
        .json({ error: "scenarioId, groupId, childId are required" });
    }
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    const scenarioObjId = new mongoose.Types.ObjectId(scenarioId);
    const groupObjId = new mongoose.Types.ObjectId(groupId);
    const childObjId = new mongoose.Types.ObjectId(childId);

    await assertHierarchy({
      scenarioId: scenarioObjId,
      groupId: groupObjId,
      childId: childObjId,
    });

    const uploaderUid = req.user?.uid || "unknown";

    const results = [];
    for (const f of req.files) {
      const gridFsId = await uploadBufferToGridFS({
        filename: f.originalname,
        contentType: f.mimetype,
        buffer: f.buffer,
        metadata: { scenarioId, groupId, childId, uploaderUid },
      });

      const doc = await StoredFile.create({
        scenarioId: scenarioObjId,
        groupId: groupObjId,
        childId: childObjId,
        name: f.originalname,
        size: f.size,
        type: f.mimetype,
        gridFsId,
      });

      // don't return gridFsId to client
      const ret = doc.toObject();
      delete ret.gridFsId;
      results.push(ret);
    }

    return res.status(201).json({ files: results });
  } catch (err) {
    // Multer size/type errors come as generic Error
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

// GET /api/files/download/:fileId  (streams the file)
// supports ?token=ID_TOKEN query for <img> and <a> tags
router.get("/download/:fileId", async (req, res) => {
  try {
    const { fileId } = req.params;
    const meta = await StoredFile.findById(fileId).lean();
    if (!meta) return res.status(404).json({ error: "File not found" });

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

// DELETE /api/files/:fileId
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

export default router;
