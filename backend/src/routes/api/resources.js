import { Router } from "express";
import auth from "../../middleware/firebaseAuth.js";
import { handle } from "../../util/error.js";
import Resource from "../../db/models/resource.js";

import {
  createResource,
  getResourceById,
  deleteResourceById,
  getAllVisibleResources,
  updateResourceById,
  bulkCreateResources,
} from "../../db/daos/resourcesDao.js";

const router = Router();

const HTTP_OK = 200;
const HTTP_CREATED = 201;
const HTTP_NO_CONTENT = 204;
const HTTP_BAD_REQUEST = 400;
const HTTP_NOT_FOUND = 404;
const HTTP_INTERNAL_SERVER_ERROR = 500;

// 🔒 All routes require Firebase auth
router.use(auth);

/**
 * @route GET /scenario/:scenarioId
 * @desc Retrieve all resources belonging to a scenario
 */
router.get("/scenario/:scenarioId", async (req, res) => {
  const { scenarioId } = req.params;
  try {
    const resources = await Resource.find({ scenarioId });
    return res.status(HTTP_OK).json(resources);
  } catch (err) {
    return res.status(HTTP_INTERNAL_SERVER_ERROR).json({ error: err.message });
  }
});

/**
 * @route GET /group/:groupId
 * @desc Retrieve all visible resources for a group
 */
router.get("/group/:groupId", async (req, res) => {
  const { groupId } = req.params;
  if (!groupId) {
    return res.status(HTTP_BAD_REQUEST).json({ error: "Missing groupId" });
  }

  try {
    const resources = await getAllVisibleResources(groupId);
    return res.status(HTTP_OK).json(resources);
  } catch (err) {
    return res.status(HTTP_INTERNAL_SERVER_ERROR).json({ error: err.message });
  }
});

/**
 * @route POST /
 * @desc Create a new resource
 */
router.post(
  "/",
  handle(async (req, res) => {
    const { type, content, name, scenarioId, groupId, requiredFlags } =
      req.body;
    if (!type || !name || !scenarioId) {
      return res
        .status(HTTP_BAD_REQUEST)
        .json({ error: "Missing required fields" });
    }

    const newResource = await createResource(
      type,
      content,
      name,
      requiredFlags,
      {
        scenarioId,
        groupId,
      }
    );
    return res.status(HTTP_CREATED).json(newResource);
  })
);

/**
 * @route GET /:resourceId
 * @desc Retrieve a specific resource by ID
 */
router.get("/:resourceId", async (req, res) => {
  const { resourceId } = req.params;
  if (!resourceId)
    return res.status(HTTP_BAD_REQUEST).send("Missing resourceId");

  try {
    const resource = await getResourceById(resourceId);
    if (!resource) return res.status(HTTP_NOT_FOUND).send("Not Found");
    return res.status(HTTP_OK).json(resource);
  } catch (err) {
    return res.status(HTTP_INTERNAL_SERVER_ERROR).json({ error: err.message });
  }
});

/**
 * @route PUT /:resourceId
 * @desc Update an existing resource
 */
router.put("/:resourceId", async (req, res) => {
  const { resourceId } = req.params;
  const { name, type, content, requiredFlags } = req.body;

  if (!name || !type) {
    return res
      .status(HTTP_BAD_REQUEST)
      .json({ error: "Missing required fields" });
  }

  try {
    const updated = await updateResourceById(
      resourceId,
      name,
      type,
      content,
      requiredFlags
    );
    if (!updated) return res.status(HTTP_NOT_FOUND).send("Not Found");
    return res.status(HTTP_OK).json(updated);
  } catch (err) {
    return res.status(HTTP_INTERNAL_SERVER_ERROR).json({ error: err.message });
  }
});

/**
 * @route DELETE /:resourceId
 * @desc Delete a resource
 */
router.delete("/:resourceId", async (req, res) => {
  const { resourceId } = req.params;
  if (!resourceId)
    return res.status(HTTP_BAD_REQUEST).send("Missing resourceId");

  try {
    const deleted = await deleteResourceById(resourceId);
    if (!deleted) return res.status(HTTP_NOT_FOUND).send("Not Found");
    return res.status(HTTP_NO_CONTENT).send();
  } catch (err) {
    return res.status(HTTP_INTERNAL_SERVER_ERROR).json({ error: err.message });
  }
});

/**
 * @route POST /:scenarioId
 * @desc Bulk upload resources (e.g. from CSV)
 */
router.post(
  "/:scenarioId",
  handle(async (req, res) => {
    const { scenarioId } = req.params;
    const resources = req.body;

    if (!Array.isArray(resources) || resources.length === 0) {
      return res
        .status(HTTP_BAD_REQUEST)
        .json({ error: "Invalid or empty resource list" });
    }

    try {
      const saved = await bulkCreateResources(scenarioId, resources);
      return res.status(HTTP_OK).json({
        message: `Successfully uploaded ${saved.length} resources.`,
        count: saved.length,
      });
    } catch (err) {
      console.error("Failed to upload resources:", err);
      return res
        .status(HTTP_INTERNAL_SERVER_ERROR)
        .json({ error: err.message });
    }
  })
);

export default router;
