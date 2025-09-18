import { Router } from "express";
import mongoose from "mongoose";
import auth from "../../middleware/firebaseAuth.js";
import CollectionGroup from "../../db/models/CollectionGroup.js";
import CollectionChild from "../../db/models/CollectionChild.js";
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

router.use(auth);

// Create Group
router.post("/groups", async (req, res) => {
  try {
    const { scenarioId, name, order = 0 } = req.body;
    if (!scenarioId || !name)
      return res
        .status(400)
        .json({ error: "scenarioId and name are required" });

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

// Create Child
router.post("/children", async (req, res) => {
  try {
    const { scenarioId, groupId, name, order = 0 } = req.body;
    if (!scenarioId || !groupId || !name) {
      return res
        .status(400)
        .json({ error: "scenarioId, groupId and name are required" });
    }

    // Validate group belongs to scenario
    const group = await CollectionGroup.findById(groupId);
    if (!group) return res.status(404).json({ error: "Group not found" });
    if (String(group.scenarioId) !== String(scenarioId)) {
      return res
        .status(400)
        .json({ error: "groupId does not belong to scenarioId" });
    }

    const child = await CollectionChild.create({
      scenarioId: new mongoose.Types.ObjectId(scenarioId),
      groupId: new mongoose.Types.ObjectId(groupId),
      name,
      order,
    });

    return res.status(201).json(child);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Get full tree for a scenarioId
router.get("/tree/:scenarioId", async (req, res) => {
  try {
    const { scenarioId } = req.params;
    const scenarioObjId = new mongoose.Types.ObjectId(scenarioId);

    const [groups, children, files] = await Promise.all([
      CollectionGroup.find({ scenarioId: scenarioObjId })
        .sort({ order: 1, name: 1 })
        .lean(),
      CollectionChild.find({ scenarioId: scenarioObjId })
        .sort({ groupId: 1, order: 1, name: 1 })
        .lean(),
      StoredFile.find({ scenarioId: scenarioObjId })
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    // index children by groupId
    const childrenByGroup = new Map();
    for (const c of children) {
      const key = String(c.groupId);
      if (!childrenByGroup.has(key)) childrenByGroup.set(key, []);
      childrenByGroup.get(key).push({ ...c, files: [] });
    }

    // index files by childId
    const filesByChild = new Map();
    for (const f of files) {
      const key = String(f.childId);
      if (!filesByChild.has(key)) filesByChild.set(key, []);

      // omit gridFsId without creating an unused variable
      const safe = { ...f };
      delete safe.gridFsId;

      filesByChild.get(key).push(safe);
    }

    // attach files to children
    for (const list of childrenByGroup.values()) {
      for (const child of list) {
        child.files = filesByChild.get(String(child._id)) || [];
      }
    }

    // build groups -> children
    const tree = groups.map((g) => {
      const kids = childrenByGroup.get(String(g._id)) || [];
      return { ...g, children: kids };
    });

    return res.json(tree);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Delete a group (cascade children + files + GridFS)
router.delete("/groups/:groupId", async (req, res) => {
  try {
    const { groupId } = req.params;

    const group = await CollectionGroup.findById(groupId);
    if (!group) return res.status(404).json({ error: "Group not found" });

    const children = await CollectionChild.find({ groupId: group._id }, "_id");
    const childIds = children.map((c) => c._id);

    // All files under this group (covers all children)
    const files = await StoredFile.find({ groupId: group._id }, "_id gridFsId");

    // Delete GridFS blobs
    await Promise.all(files.map((f) => deleteGridFsById(f.gridFsId)));

    // Delete file metadata
    await StoredFile.deleteMany({ groupId: group._id });

    // Delete children
    await CollectionChild.deleteMany({ groupId: group._id });

    // Delete group
    await group.deleteOne();

    return res.json({
      deleted: {
        groups: 1,
        children: childIds.length,
        files: files.length,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Delete a child (cascade files + GridFS)
router.delete("/children/:childId", async (req, res) => {
  try {
    const { childId } = req.params;

    const child = await CollectionChild.findById(childId);
    if (!child) return res.status(404).json({ error: "Child not found" });

    const files = await StoredFile.find({ childId: child._id }, "_id gridFsId");

    await Promise.all(files.map((f) => deleteGridFsById(f.gridFsId)));
    await StoredFile.deleteMany({ childId: child._id });
    await child.deleteOne();

    return res.json({
      deleted: {
        children: 1,
        files: files.length,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
