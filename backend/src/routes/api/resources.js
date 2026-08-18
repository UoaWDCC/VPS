import { Router } from "express";
import auth from "../../middleware/firebaseAuth.js";
import { handle, HttpError } from "../../util/error.js";
import scenarioAuth from "../../middleware/scenarioAuth.js";
import { HttpStatusCode } from "axios";
import {
  applyReferenceDelta,
  applyReferenceDeltas,
} from "../../db/daos/fileDao.js";
import Resource, {
  RESOURCE_NAME_MAX_LENGTH,
} from "../../db/models/resource.js";
import { isValidObjectId } from "../../util/validation.js";
import UploadedFile from "../../db/models/uploadedFile.js";

const router = Router();

router.use(auth);

/**
 * @route GET /api/resources/:scenarioId
 * @desc Get all resources for a scenario
 * NOTE: this route is unprotected currently, will be addressed with assignment refactor
 */
router.get(
  "/:scenarioId",
  handle(async (req, res) => {
    const { scenarioId } = req.params;

    const resources = await Resource.find({ scenarioId })
      .populate("fileId", "name url type contentType size")
      .sort({ parentId: 1, createdAt: -1 })
      .lean();

    return res.json(resources);
  })
);

router.use("/:scenarioId", scenarioAuth);

/**
 * @route POST /api/resources/:scenarioId
 * @desc Upload a file resource, optionally to a collection
 */
router.post(
  "/:scenarioId",
  handle(async (req, res) => {
    const { scenarioId } = req.params;
    const { parentId, name, fileId } = req.body;

    if (!name || !fileId)
      throw new HttpError(
        "missing required properties",
        HttpStatusCode.BadRequest
      );

    if (parentId && !isValidObjectId(parentId))
      throw new HttpError("invalid parent id", HttpStatusCode.BadRequest);
    if (!isValidObjectId(fileId))
      throw new HttpError("invalid file id", HttpStatusCode.BadRequest);

    if (parentId) {
      const parent = await Resource.exists({
        _id: parentId,
        scenarioId,
        type: "collection",
      });
      if (!parent)
        throw new HttpError(
          "parent collection not found",
          HttpStatusCode.NotFound
        );
    }

    const file = await UploadedFile.exists({ _id: fileId, scenarioId });
    if (!file) throw new HttpError("file not found", HttpStatusCode.NotFound);

    const resource = await Resource.create({
      type: "file",
      scenarioId,
      parentId,
      name,
      fileId,
    });
    await resource.populate("fileId", "name url type contentType size");

    await applyReferenceDelta(fileId, 1);

    return res.status(HttpStatusCode.Created).json(resource);
  })
);

/**
 * @route POST /api/resources/:scenarioId/collection
 * @desc Create a resource collection
 */
router.post(
  "/:scenarioId/collection",
  handle(async (req, res) => {
    const { scenarioId } = req.params;
    const { name } = req.body;

    if (!name)
      throw new HttpError(
        "missing required properties",
        HttpStatusCode.BadRequest
      );

    const resource = await Resource.create({
      type: "collection",
      scenarioId,
      name,
    });

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

    if (!isValidObjectId(resourceId))
      throw new HttpError("invalid resource id", HttpStatusCode.BadRequest);

    const resource = await Resource.findOneAndDelete({
      _id: resourceId,
      scenarioId,
    });
    if (!resource)
      throw new HttpError("resource not found", HttpStatusCode.NotFound);

    const fileRefDeltas = new Map();

    if (resource.type === "collection") {
      const children = await Resource.find({ parentId: resource._id });
      for (const child of children) {
        if (child.fileId) {
          const fileId = child.fileId.toString();
          fileRefDeltas.set(fileId, (fileRefDeltas.get(fileId) ?? 0) - 1);
        }
      }
      await Resource.deleteMany({ parentId: resource._id });
    } else {
      if (resource.fileId) {
        fileRefDeltas.set(resource.fileId.toString(), -1);
      }
    }

    await applyReferenceDeltas(fileRefDeltas);

    return res.status(HttpStatusCode.NoContent).send();
  })
);

/**
 * @route PATCH /api/resources/:scenarioId/:resourceId
 * @desc Rename a resource
 */
router.patch(
  "/:scenarioId/:resourceId",
  handle(async (req, res) => {
    const { scenarioId, resourceId } = req.params;
    const { name } = req.body;

    if (!isValidObjectId(resourceId))
      throw new HttpError("invalid resource id", HttpStatusCode.BadRequest);

    const trimmedName = typeof name === "string" ? name.trim() : "";

    if (!trimmedName)
      throw new HttpError("name is required", HttpStatusCode.BadRequest);

    if (trimmedName.length > RESOURCE_NAME_MAX_LENGTH)
      throw new HttpError(
        `name must be ${RESOURCE_NAME_MAX_LENGTH} characters or fewer`,
        HttpStatusCode.BadRequest
      );

    const resource = await Resource.findOneAndUpdate(
      { _id: resourceId, scenarioId },
      { name: trimmedName },
      { new: true, runValidators: true }
    ).populate("fileId", "name url type contentType size");

    if (!resource)
      throw new HttpError("resource not found", HttpStatusCode.NotFound);

    return res.json(resource);
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
      .populate("fileId", "name url type contentType size")
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
      .populate("fileId", "name url type contentType size")
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
      .populate("fileId", "name url type contentType size")
      .lean();

    if (!resource)
      throw new HttpError("resource not found", HttpStatusCode.NotFound);
    return res.json(resource);
  })
);

export default router;
