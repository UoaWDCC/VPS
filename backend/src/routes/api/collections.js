import { Router } from "express";
import mongoose from "mongoose";
import auth from "../../middleware/firebaseAuth.js";
import CollectionGroup from "../../db/models/CollectionGroup.js";
import Resource from "../../db/models/resource.js";

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

    const [groups, files] = await Promise.all([
      CollectionGroup.find({ scenarioId }).sort({ order: 1, name: 1 }).lean(),
      Resource.find({ scenarioId })
        .populate("fileId", "url type contentType size")
        .sort({ groupId: 1, createdAt: -1 })
        .lean(),
    ]);

    // index files by groupId
    const filesByGroup = new Map();
    for (const f of files) {
      const key = String(f.groupId);
      if (!filesByGroup.has(key)) filesByGroup.set(key, []);
      filesByGroup.get(key).push(f);
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

    const files = await Resource.find({ groupId: group._id });

    await Resource.deleteMany({ groupId: group._id });

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

/**
 * @route POST /api/collections/groups/:groupId/state-conditionals
 * @desc Add a state conditional to a collection group
 */
router.post("/groups/:groupId/state-conditionals", async (req, res) => {
  try {
    const { groupId } = req.params;
    const { stateConditional } = req.body;
    if (
      !stateConditional ||
      !stateConditional.stateVariableId ||
      !stateConditional.comparator ||
      stateConditional.value === undefined
    ) {
      return res
        .status(400)
        .json({ error: "Invalid stateConditional payload" });
    }
    const group = await CollectionGroup.findById(groupId);
    if (!group) return res.status(404).json({ error: "Group not found" });

    group.stateConditionals.push(stateConditional);
    await group.save();

    return res.json(group);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * `@route` PUT /api/collections/groups/:groupId/state-conditionals
 * `@desc` Update a state conditional on a collection group
 */
router.put("/groups/:groupId/state-conditionals", async (req, res) => {
  try {
    const { groupId } = req.params;
    const { stateConditional } = req.body;
    const group = await CollectionGroup.findById(groupId);
    if (!group) return res.status(404).json({ error: "Group not found" });

    let found = false;
    group.stateConditionals = group.stateConditionals.map((sc) => {
      if (sc._id.toString() === stateConditional._id) {
        found = true;
        return stateConditional;
      }
      return sc;
    });
    if (!found) {
      return res.status(404).json({ error: "State conditional not found" });
    }

    await group.save();

    return res.json(group);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * @route DELETE /api/collections/groups/:groupId/state-conditionals/:stateConditionalId
 * @desc Delete a state conditional from a collection group
 */
router.delete(
  "/groups/:groupId/state-conditionals/:stateConditionalId",
  async (req, res) => {
    try {
      const { groupId, stateConditionalId } = req.params;
      const group = await CollectionGroup.findById(groupId);
      if (!group) return res.status(404).json({ error: "Group not found" });

      const originalLength = group.stateConditionals.length;
      group.stateConditionals = group.stateConditionals.filter(
        (sc) => sc._id.toString() !== stateConditionalId
      );

      if (group.stateConditionals.length === originalLength) {
        return res.status(404).json({ error: "State conditional not found" });
      }

      await group.save();

      return res.json(group);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
);

export default router;
