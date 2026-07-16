import { Router } from "express";
import auth from "../../middleware/firebaseAuth.js";
import { handle, HttpError } from "../../util/error.js";
import scenarioAuth from "../../middleware/scenarioAuth.js";
import CollectionGroup from "../../db/models/CollectionGroup.js";
import { HttpStatusCode } from "axios";
import { applyReferenceDelta } from "../../db/daos/fileDao.js";
import Resource from "../../db/models/resource.js";
import { isValidObjectId } from "../../util/validation.js";
import UploadedFile from "../../db/models/uploadedFile.js";

const router = Router();

router.use(auth);
router.use("/:scenarioId", scenarioAuth);

/**
 * @route POST /api/resources/:scenarioId
 * @desc Upload a file to a resource group
 */
router.post(
  "/:scenarioId",
  handle(async (req, res) => {
    const { scenarioId } = req.params;
    const { groupId, name, fileId } = req.body;

    if (!groupId || !name || !fileId)
      throw new HttpError(
        "missing required properties",
        HttpStatusCode.BadRequest
      );

    if (!isValidObjectId(groupId))
      throw new HttpError("invalid group id", HttpStatusCode.BadRequest);
    if (!isValidObjectId(fileId))
      throw new HttpError("invalid file id", HttpStatusCode.BadRequest);

    const group = await CollectionGroup.exists({ _id: groupId, scenarioId });
    if (!group) throw new HttpError("group not found", HttpStatusCode.NotFound);

    const file = await UploadedFile.exists({ _id: fileId, scenarioId });
    if (!file) throw new HttpError("file not found", HttpStatusCode.NotFound);

    const resource = await Resource.create({
      scenarioId,
      groupId,
      name,
      fileId,
    });
    await resource.populate("fileId", "url type contentType size");

    await applyReferenceDelta(fileId, 1);

    return res.status(HttpStatusCode.Created).json(resource);
  })
);

/**
 * @route DELETE /api/resources/:scenarioId/:resourceId
 * @desc Delete a resource
 */
router.delete(
  "/:scenarioId/:resourceId",
  handle(async (req, res) => {
    const { scenarioId, resourceId } = req.params;

    const resource = await Resource.findOneAndDelete({
      _id: resourceId,
      scenarioId,
    });
    if (!resource)
      throw new HttpError("resource not found", HttpStatusCode.NotFound);

    await applyReferenceDelta(resource.fileId, -1);

    return res.status(HttpStatusCode.NoContent).send();
  })
);

/**
 * @route POST /api/resources/:scenarioId/:resourceId/conditionals
 * @desc Add a state conditional to a resource
 */
router.post(
  "/:scenarioId/:resourceId/conditionals",
  handle(async (req, res) => {
    const { scenarioId, resourceId } = req.params;
    const { stateConditional } = req.body;

    const resource = await Resource.findOneAndUpdate(
      { _id: resourceId, scenarioId },
      { $push: { stateConditionals: stateConditional } },
      { new: true, runValidators: true }
    )
      .populate("fileId", "url type contentType size")
      .lean();

    if (!resource)
      throw new HttpError("resource not found", HttpStatusCode.NotFound);

    return res.json(resource);
  })
);

/**
 * @route PUT /api/resources/:scenarioId/:resourceId/conditionals
 * @desc Update a state conditional on a resource
 */
router.put(
  "/:scenarioId/:resourceId/conditionals",
  handle(async (req, res) => {
    const { scenarioId, resourceId } = req.params;
    const { stateConditional } = req.body;

    const resource = await Resource.findOneAndUpdate(
      {
        _id: resourceId,
        scenarioId,
        "stateConditionals._id": stateConditional._id,
      },
      { $set: { "stateConditionals.$": stateConditional } },
      { new: true, runValidators: true }
    )
      .populate("fileId", "url type contentType size")
      .lean();

    if (!resource)
      throw new HttpError("resource not found", HttpStatusCode.NotFound);

    return res.json(resource);
  })
);

/**
 * @route DELETE /api/resources/:scenarioId/:resourceId/conditionals/:conditionalId
 * @desc Delete a state conditional from a resource
 */
router.delete(
  "/:scenarioId/:resourceId/conditionals/:conditionalId",
  handle(async (req, res) => {
    const { scenarioId, resourceId, conditionalId } = req.params;

    const resource = await Resource.findOneAndUpdate(
      { _id: resourceId, scenarioId, "stateConditionals._id": conditionalId },
      { $pull: { stateConditionals: { _id: conditionalId } } },
      { new: true }
    )
      .populate("fileId", "url type contentType size")
      .lean();

    if (!resource)
      throw new HttpError("resource not found", HttpStatusCode.NotFound);
    return res.json(resource);
  })
);

export default router;
