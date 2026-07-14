import { Router } from "express";
import auth from "../../middleware/firebaseAuth.js";
import { handle, HttpError } from "../../util/error.js";
import scenarioAuth from "../../middleware/scenarioAuth.js";
import StoredFile from "../../db/models/storedFile.js";
import CollectionGroup from "../../db/models/CollectionGroup.js";
import { HttpStatusCode } from "axios";
import { applyReferenceDelta } from "../../db/daos/fileDao.js";

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

    const { groupId, name, fileId, url, type, contentType } = req.body;

    if (!groupId || !name || !fileId || !url || !type || !contentType)
      throw new HttpError(
        "missing required properties",
        HttpStatusCode.BadRequest
      );

    const group = await CollectionGroup.findOne({ _id: groupId, scenarioId });
    if (!group) throw new HttpError("group not found", HttpStatusCode.NotFound);

    const storedFile = await StoredFile.create({
      scenarioId,
      groupId,
      name,
      type,
      fileId,
      url,
      contentType,
    });

    await applyReferenceDelta(storedFile.fileId, 1);

    return res.status(201).json(storedFile);
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

    const storedFile = await StoredFile.findOneAndDelete({
      _id: resourceId,
      scenarioId,
    });
    if (!storedFile)
      throw new HttpError("resource not found", HttpStatusCode.NotFound);

    await applyReferenceDelta(storedFile.fileId, -1);

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

    const storedFile = await StoredFile.findOneAndUpdate(
      { _id: resourceId, scenarioId },
      { $push: { stateConditionals: stateConditional } },
      { new: true }
    );

    if (!storedFile)
      throw new HttpError("resource not found", HttpStatusCode.NotFound);
    return res.json(storedFile);
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

    const storedFile = await StoredFile.findOneAndUpdate(
      {
        _id: resourceId,
        scenarioId,
        "stateConditionals._id": stateConditional._id,
      },
      { $set: { "stateConditionals.$": stateConditional } },
      { new: true }
    );

    if (!storedFile)
      throw new HttpError("resource not found", HttpStatusCode.NotFound);
    return res.json(storedFile);
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

    const storedFile = await StoredFile.findOneAndUpdate(
      { _id: resourceId, scenarioId },
      { $pull: { stateConditionals: { _id: conditionalId } } },
      { new: true }
    );

    if (!storedFile)
      throw new HttpError("resource not found", HttpStatusCode.NotFound);
    return res.json(storedFile);
  })
);

export default router;
