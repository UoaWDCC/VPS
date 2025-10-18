import { Router } from "express";
import mongoose from "mongoose";
import auth from "../../middleware/firebaseAuth.js";
import CollectionGroup from "../../db/models/CollectionGroup.js";
import StoredFile from "../../db/models/StoredFile.js";
import { deleteGridFsById } from "../../util/gridfs.js";

const router = Router();

// Allow ?token=ID_TOKEN for <img src> / links (copy to Authorization header)
router.use((req, _res, next) => {
  if (req.query && req.query.token && !req.headers.authorization) {
    req.headers.authorization = `Bearer ${req.query.token}`;
  }
  next();
});

// Require Firebase auth for all routes below
router.use(auth);

/**
 * @route POST /api/collections/groups
 * @desc Create a new group under a scenario
 */
router.post("/groups", async (req, res) => {
  try {
    const { scenarioId, name, order = 0 } = req.body;
    if (!scenarioId || !name) {
      return res
        .status(400)
        .json({ error: "scenarioId and name are required" });
    }

    const group = await CollectionGroup.create({
      scenarioId: new mongoose.Types.ObjectId(scenarioId),
      name,
      order,
    });

    return res.status(201).json(group);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * @route GET /api/collections/tree/:scenarioId
 * @desc Get all groups + their files for a scenario
 */
router.get("/tree/:scenarioId", async (req, res) => {
  try {
    const { scenarioId } = req.params;
    const scenarioObjId = new mongoose.Types.ObjectId(scenarioId);

    const [groups, files] = await Promise.all([
      CollectionGroup.find({ scenarioId: scenarioObjId })
        .sort({ order: 1, name: 1 })
        .lean(),
      StoredFile.find({ scenarioId: scenarioObjId })
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    // index files by groupId
    const filesByGroup = new Map();
    for (const f of files) {
      const key = String(f.groupId);
      if (!filesByGroup.has(key)) filesByGroup.set(key, []);
      const safe = { ...f };
      delete safe.gridFsId; // never send internal GridFS IDs to client
      filesByGroup.get(key).push(safe);
    }

    // attach files directly to each group
    const tree = groups.map((g) => ({
      ...g,
      files: filesByGroup.get(String(g._id)) || [],
    }));

    return res.json(tree);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * @route DELETE /api/collections/groups/:groupId
 * @desc Delete a group and all associated files
 */
router.delete("/groups/:groupId", async (req, res) => {
  try {
    const { groupId } = req.params;

    const group = await CollectionGroup.findById(groupId);
    if (!group) return res.status(404).json({ error: "Group not found" });

    const files = await StoredFile.find({ groupId: group._id }, "_id gridFsId");

    // Delete GridFS blobs and metadata
    await Promise.all(files.map((f) => deleteGridFsById(f.gridFsId)));
    await StoredFile.deleteMany({ groupId: group._id });

    // Delete group
    await group.deleteOne();

    return res.json({
      deleted: {
        groups: 1,
        files: files.length,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
