import { Router } from "express";
import auth from "../../middleware/firebaseAuth";
import handle from "../../error/handle";

import {
  createResource,
  getResourceById,
  deleteResourceById,
  addFlag,
  removeFlag,
  getAllVisibleResources,
  updateResourceById,
} from "../../db/daos/resourcesDao";

const router = Router();

const HTTP_OK = 200;
const HTTP_CREATED = 201;
const HTTP_NO_CONTENT = 204;
const HTTP_BAD_REQUEST = 400;
const HTTP_NOT_FOUND = 404;
const HTTP_INTERNAL_SERVER_ERROR = 500;

// Apply auth middleware to all routes below this point
// router.use(auth);

/**
 * @route POST /
 * @desc Create a New Resource
 * @param {Object} req.body - The resource details.
 * @param {string} req.body.type - The type of the resource as text or image
 * @param {string} req.body.content - The content of the resource. as either a string or an image?
 * @param {string} req.body.name - The name of the resource.
 * @returns {Object} 201 - The newly created resource.
 */
router.post(
  "/",
  handle(async (req, res) => {
    const { type, content, name } = req.body;
    const newResource = await createResource(type, content, name);
    return res.status(HTTP_CREATED).json(newResource).send();
  })
);

/**
 * @route GET /:resourceId
 * @desc Retrieve a Specific Resource
 * @param {string} req.params.resourceId - The unique identifier of the resource.
 * @returns {Object} 200 - The resource details.
 * @returns {string} 400 - Bad Request if resourceId is not provided.
 * @returns {string} 404 - Not Found if the resource does not exist.
 */
router.get("/:resourceId", async (req, res) => {
  if (!req.params.resourceId) {
    return res.status(HTTP_BAD_REQUEST).send("Bad Request");
  }
  const resource = await getResourceById(req.params.resourceId);
  if (!resource) {
    return res.status(HTTP_NOT_FOUND).send("Not Found");
  }
  return res.status(HTTP_OK).json(resource);
});

/**
 * @route DELETE /:resourceId
 * @desc Delete a Resource
 * @param {string} req.params.resourceId - The unique identifier of the resource.
 * @returns {string} 204 - Resource deleted successfully.
 * @returns {string} 400 - Bad Request if resourceId is not provided.
 * @returns {string} 404 - Not Found if the resource does not exist.
 */
router.delete("/:resourceId", async (req, res) => {
  if (!req.params.resourceId) {
    return res.status(HTTP_BAD_REQUEST).send("Bad Request");
  }
  const deleted = await deleteResourceById(req.params.resourceId);
  if (!deleted) {
    return res.status(HTTP_NOT_FOUND).send("Not Found");
  }
  return res.status(HTTP_NO_CONTENT).send("Resource deleted");
});

/**
 * @route GET /group/:groupId
 * @desc Retrieve All Visible Resources for a Group
 * @param {string} req.params.groupId - The unique identifier of the group.
 * @returns {Object[]} 200 - An array of visible resources for the group.
 * @returns {string} 400 - Bad Request if groupId is not provided.
 */
router.get("/group/:groupId", async (req, res) => {
  const { groupId } = req.params;
  if (!groupId) {
    return res.status(HTTP_BAD_REQUEST).send("Bad Request");
  }
  const resources = await getAllVisibleResources(groupId);
  return res.status(HTTP_OK).json(resources);
});

/**
 * @route POST /group/:groupId/:flag
 * @desc Add a Flag to Group Flags
 * @param {string} req.params.groupId - The unique identifier of the group.
 * @param {string} req.params.flag - The flag to be added.
 * @returns {string[]} 200 - The updated list of flags for the group.
 * @returns {string} 400 - Bad Request if groupId or flag is not provided.
 */
router.post("/group/:groupId/:flag", async (req, res) => {
  const { groupId, flag } = req.params;
  if (!groupId || !flag) {
    return res.status(HTTP_BAD_REQUEST).send("Bad Request");
  }
  const flags = await addFlag(groupId, flag);
  return res.status(HTTP_OK).json(flags);
});

/**
 * @route DELETE /group/:groupId/:flag
 * @desc Remove a Flag from Group Flags
 * @param {string} req.params.groupId - The unique identifier of the group.
 * @param {string} req.params.flag - The flag to be removed.
 * @returns {string[]} 200 - The updated list of flags for the group.
 * @returns {string} 400 - Bad Request if groupId or flag is not provided.
 */
router.delete("/group/:groupId/:flag", async (req, res) => {
  const { groupId, flag } = req.params;
  if (!groupId || !flag) {
    return res.status(HTTP_BAD_REQUEST).send("Bad Request");
  }
  const flags = await removeFlag(groupId, flag);
  return res.status(HTTP_OK).json(flags);
});

/**
 * @route PUT /:resourceId
 * @desc Update a Resource
 * @param {string} req.params.resourceId - The unique identifier of the resource.
 * @param {Object} req.body - The updated resource details.
 * @param {string} req.body.type - The type of the resource.
 * @param {string} req.body.content - The content of the resource.
 * @param {string} req.body.name - The name of the resource.
 * @returns {Object} 200 - The updated resource.
 * @returns {string} 400 - Bad Request if required fields are missing.
 * @returns {string} 404 - Not Found if the resource does not exist.
 * @returns {string} 500 - Internal Server Error if an unexpected error occurs.
 */

router.put("/:resourceId", async (req, res) => {
  const { resourceId } = req.params;
  const { name, type, content } = req.body;

  if (!content || !name || !type) {
    return res.status(HTTP_BAD_REQUEST).send("Bad Request");
  }

  try {
    const updatedResource = await updateResourceById(
      resourceId,
      name,
      type,
      content
    );

    if (!updatedResource) {
      return res.status(HTTP_NOT_FOUND).send("Not Found");
    }

    return res.status(HTTP_OK).json(updatedResource);
  } catch (error) {
    return res.status(HTTP_INTERNAL_SERVER_ERROR).send("Internal Server Error");
  }
});

export default router;
