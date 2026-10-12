import Scene from "../models/scene.js";
import Scenario from "../models/scenario.js";
import { HttpError } from "../../util/error.js";
import status from "../../util/status.js";
import { applyReferenceDeltas } from "./fileDao.js";
import { getProperties } from "./scenarioDao.js";
import { HttpStatusCode } from "axios";
import mongoose from "mongoose";

/**
 * Adds a reference-count delta to a file ID entry in a map.
 *
 * @param {Map<string, number>} fileRefDeltas - Map of file IDs to delta amounts.
 * @param {string} fileId - The file ID to update.
 * @param {number} delta - The amount to add to the stored delta.
 * @returns {void}
 */
export function addDelta(fileRefDeltas, fileId, delta) {
  fileRefDeltas.set(fileId, (fileRefDeltas.get(fileId) ?? 0) + delta);
}

/**
 * Determines whether a scene component is linked to a file reference.
 *
 * @param {object|undefined} component - The scene component to inspect.
 * @returns {boolean} True when the component references an audio or image file.
 */
export function hasFileRef(component) {
  if (!component) return false;
  return (
    ["audio", "image"].includes(component.type) && Boolean(component.fileId)
  );
}

function backgroundFileId(background) {
  return background?.kind === "image" ? (background.fileId ?? null) : null;
}

/**
 * Calculates the file reference deltas created by a scene's components and
 * its background image, if any.
 *
 * @param {Array<object>} [components=[]] - The scene components to inspect.
 * @param {object|null} [background] - The scene's background configuration.
 * @returns {Map<string, number>} The resulting reference delta map.
 */
function computeCreateFileRefDeltas(components, background) {
  const fileRefDeltas = new Map();
  (components ?? []).forEach((component) => {
    if (hasFileRef(component)) {
      addDelta(fileRefDeltas, component.fileId, 1);
    }
  });
  const fileId = backgroundFileId(background);
  if (fileId) addDelta(fileRefDeltas, fileId, 1);
  return fileRefDeltas;
}

/**
 * Calculates the file reference deltas removed by deleting scene components
 * and its background image, if any.
 *
 * @param {Array<object>} [components=[]] - The scene components being removed.
 * @param {object|null} [background] - The scene's background configuration.
 * @returns {Map<string, number>} The resulting reference delta map.
 */
function computeDeleteFileRefDeltas(components, background) {
  const fileRefDeltas = new Map();
  (components ?? []).forEach((component) => {
    if (hasFileRef(component)) {
      addDelta(fileRefDeltas, component.fileId, -1);
    }
  });
  const fileId = backgroundFileId(background);
  if (fileId) addDelta(fileRefDeltas, fileId, -1);
  return fileRefDeltas;
}

/**
 * Calculates the file reference deltas resulting from a component patch.
 *
 * @param {object} componentsDiff - Structured component diff.
 * @param {Array<object>} componentsDiff.upserted - Components created/updated by the patch.
 * @param {Array<string>} componentsDiff.deleted - Component IDs removed by the patch.
 * @param {Array<object>} [existingComponents=[]] - The scene's previous components.
 * @returns {Map<string, number>} The resulting reference delta map.
 */
function computePatchFileRefDeltas({ upserted, deleted }, existingComponents) {
  const existingComponentsById = new Map(
    (existingComponents ?? []).map((c) => [c.id, c])
  );

  const fileRefDeltas = new Map();

  deleted.forEach((id) => {
    const existing = existingComponentsById.get(id);
    if (hasFileRef(existing)) addDelta(fileRefDeltas, existing.fileId, -1);
  });

  upserted.forEach((component) => {
    const existing = existingComponentsById.get(component.id);

    // decrement the previously referenced file (if any) and increment the
    // newly referenced one (if any). this handles brand new components, a
    // component whose file reference was cleared, and a component whose
    // fileId was swapped in place
    const existingFileId = hasFileRef(existing) ? existing.fileId : null;
    const newFileId = hasFileRef(component) ? component.fileId : null;

    if (existingFileId === newFileId) return;
    if (existingFileId) addDelta(fileRefDeltas, existingFileId, -1);
    if (newFileId) addDelta(fileRefDeltas, newFileId, 1);
  });

  return fileRefDeltas;
}

function addBackgroundPatchFileRefDeltas(
  fileRefDeltas,
  existingBackground,
  modifiedBackground
) {
  const existingFileId = backgroundFileId(existingBackground);
  const newFileId = backgroundFileId(modifiedBackground);

  if (String(existingFileId) === String(newFileId)) return;
  if (existingFileId) addDelta(fileRefDeltas, existingFileId, -1);
  if (newFileId) addDelta(fileRefDeltas, newFileId, 1);
}

// enforce that a set of scenes (e.g. action linkedScene targets) all belong
// to the given scenario
const assertScenesInScenario = async (scenarioId, sceneIds) => {
  const ids = [
    ...new Set(sceneIds.filter((id) => id != null).map((id) => id.toString())),
  ];
  if (ids.length === 0) return;

  const inScenario = await Scenario.exists({
    _id: scenarioId,
    scenes: { $all: ids },
  });
  if (!inScenario) {
    throw new HttpError(
      "linkedScene target must belong to the same scenario",
      status.BAD_REQUEST
    );
  }
};

// reject duplicate action names within a scene's actions[]
const assertUniqueActionNames = (actions) => {
  const seen = new Set();
  for (const action of actions) {
    const name = action.name?.trim();
    if (seen.has(name)) {
      throw new HttpError(
        `Duplicate action name "${name}" in scene`,
        status.BAD_REQUEST
      );
    }
    seen.add(name);
  }
};

// reject duplicate action ids within a scene's actions[]
const assertUniqueActionIds = (actions) => {
  const seen = new Set();
  for (const action of actions) {
    if (seen.has(action.id)) {
      throw new HttpError(
        `Duplicate action id "${action.id}" in scene`,
        status.BAD_REQUEST
      );
    }
    seen.add(action.id);
  }
};

// a condition/operation that hasn't changed is allowed through even if its
// property has since been deleted
const isUnchangedRef = (item, existingItems, typeField) => {
  const existing = existingItems?.find((e) => e.id === item.id);
  return (
    existing !== undefined &&
    existing.stateVariableId === item.stateVariableId &&
    existing[typeField] === item[typeField] &&
    existing.value === item.value
  );
};

// collect the conditions/operations that need validating
const getChangedPropertyRefs = (actions, existingActions) => {
  const existingActionsById = new Map(existingActions.map((a) => [a.id, a]));
  const conditions = [];
  const operations = [];

  for (const action of actions) {
    const existingAction = existingActionsById.get(action.id);
    conditions.push(
      ...(action.conditions ?? []).filter(
        (c) => !isUnchangedRef(c, existingAction?.conditions, "comparator")
      )
    );
    operations.push(
      ...(action.operations ?? []).filter(
        (o) => !isUnchangedRef(o, existingAction?.operations, "operation")
      )
    );
  }

  return { conditions, operations };
};

// validate that each condition/operation references a real property. type
// mismatches are allowed through, since a property can change type after the
// fact; the editor surfaces them and playback ignores them
const assertRefsResolve = ({ conditions, operations }, properties) => {
  const propertyIds = new Set(properties.map((p) => p.id));

  const condition = conditions.find((c) => !propertyIds.has(c.stateVariableId));
  if (condition) {
    throw new HttpError(
      `Condition references unknown property "${condition.stateVariableId}"`,
      status.BAD_REQUEST
    );
  }

  const operation = operations.find((o) => !propertyIds.has(o.stateVariableId));
  if (operation) {
    throw new HttpError(
      `Operation references unknown property "${operation.stateVariableId}"`,
      status.BAD_REQUEST
    );
  }
};

// reject malformed action refs, or refs sharing an id within one list
const assertActionRefsShape = (actionRefs, label) => {
  if (!Array.isArray(actionRefs)) {
    throw new HttpError(`${label} must be an array`, status.BAD_REQUEST);
  }
  const seen = new Set();
  for (const ref of actionRefs) {
    if (
      typeof ref?.id !== "string" ||
      typeof ref.actionId !== "string" ||
      typeof ref.index !== "string"
    ) {
      throw new HttpError(
        `${label} contains a malformed action ref`,
        status.BAD_REQUEST
      );
    }
    if (seen.has(ref.id)) {
      throw new HttpError(
        `Duplicate action ref id "${ref.id}" in ${label}`,
        status.BAD_REQUEST
      );
    }
    seen.add(ref.id);
  }
};

// reject an action ref that doesn't resolve against the scene's actions[]. a
// ref already stored with the same id and actionId is a preexisting reference,
// and is allowed through even if its action has since been deleted
const assertActionRefsResolve = (actionRefs, existingRefs, validIds, label) => {
  const existingById = new Map((existingRefs ?? []).map((r) => [r.id, r]));
  const validIdSet = new Set(validIds);
  const dangling = actionRefs.find(
    (ref) =>
      existingById.get(ref.id)?.actionId !== ref.actionId &&
      !validIdSet.has(ref.actionId)
  );
  if (dangling) {
    throw new HttpError(
      `${label} references unknown action id "${dangling.actionId}"`,
      status.BAD_REQUEST
    );
  }
};

// uniqueness must hold across the full effective actions[]
const assertActionsUnique = (effectiveActions) => {
  assertUniqueActionIds(effectiveActions);
  assertUniqueActionNames(effectiveActions);
};

// validates an actions[] list, against the scene's currently stored actions
const assertActionsContentValid = async (
  scenarioId,
  actions,
  existingActions = []
) => {
  const existingById = new Map(existingActions.map((a) => [a.id, a]));
  const changedLinkedSceneIds = actions
    .filter(
      (action) =>
        action.linkedScene &&
        String(action.linkedScene) !==
          String(existingById.get(action.id)?.linkedScene)
    )
    .map((action) => action.linkedScene);
  await assertScenesInScenario(scenarioId, changedLinkedSceneIds);

  const changedRefs = getChangedPropertyRefs(actions, existingActions);
  if (changedRefs.conditions.length || changedRefs.operations.length) {
    const properties = await getProperties(scenarioId);
    assertRefsResolve(changedRefs, properties);
  }
};

/**
 * Creates a scene in the database from a name alone, and updates its parent scenario to contain the scene
 * @param {String} scenarioId MongoDB ID of parent scenario
 * @param {{name: String}} scene scene object
 * @returns the created database scene object
 */
export async function createScene(scenarioId, { name }) {
  const scenarioExists = await Scenario.exists({ _id: scenarioId });
  if (!scenarioExists)
    throw new HttpError("scenario not found", status.NOT_FOUND);

  const dbScene = new Scene({ name });
  await dbScene.save();

  await Scenario.updateOne(
    { _id: scenarioId },
    { $push: { scenes: dbScene._id } }
  );

  return dbScene;
}

/**
 * Retrieves all scenes of a scenario
 * @param {String} scenarioId MongoDB ID of scenario
 * @returns list of database scene objects
 */
export const retrieveSceneList = async (scenarioId) => {
  const dbScenario = await Scenario.findById(scenarioId);
  const dbScenes = await Scene.find({ _id: { $in: dbScenario.scenes } }, [
    "name",
    "tag",
  ]);

  const orderedScenes = dbScenario.scenes
    .map((sceneId) =>
      dbScenes.find((scene) => scene._id.toString() === sceneId.toString())
    )
    .filter(Boolean);

  return orderedScenes;
};

/**
 * Retrieves a scene from the database
 * @param {String} sceneId MongoDB ID of scene
 * @returns database scene object
 */
export const retrieveScene = async (sceneId) => {
  const dbScene = await Scene.findById(sceneId);

  return dbScene;
};

/**
 * Deletes a scene from the database, and removes it from its parent scenario
 * @param {String} scenarioId MongoDB ID of scenario
 * @param {String} sceneId MongoDB ID of scene
 * @returns {Promise<{deleted: Boolean, reason?: String}>} deletion result
 */
export const deleteScene = async (scenarioId, sceneId) => {
  const scenarioRes = await Scenario.findOneAndUpdate(
    {
      _id: scenarioId,
      scenes: sceneId,
      $expr: { $gt: [{ $size: "$scenes" }, 1] },
    },
    { $pull: { scenes: sceneId } }
  );

  if (!scenarioRes) {
    const scenario = await Scenario.findById(scenarioId, { scenes: 1 }).lean();

    if (
      scenario?.scenes?.length === 1 &&
      scenario.scenes[0].toString() === sceneId.toString()
    ) {
      return { deleted: false, reason: "last_scene" };
    }

    return { deleted: false, reason: "not_found" };
  }

  // links to the deleted scene are left in place, they show
  // as errored in the editor and are ignored during playback

  const res = await Scene.findOneAndDelete({ _id: sceneId });

  if (res) {
    const fileRefDeltas = computeDeleteFileRefDeltas(
      res.components,
      res.background
    );
    await applyReferenceDeltas(fileRefDeltas);
  }

  return {
    deleted: res !== null,
    reason: res ? undefined : "not_found",
  };
};

/**
 * Duplicates a scene in the database and updates its parent scenario to contain the new scene
 * @param {String} scenarioId MongoDB ID of scenario
 * @param {String} sceneId MongoDB ID of scene
 * @returns duplicated database scene object
 */
export const duplicateScene = async (scenarioId, sceneId) => {
  const sceneToCopy = await Scene.findById(sceneId);
  const newScene = {
    name: `${sceneToCopy.name} Copy`,
    components: sceneToCopy.components,
    time: sceneToCopy.time,
    actions: sceneToCopy.actions ?? [],
    defaultLinkedScene: sceneToCopy.defaultLinkedScene ?? null,
    timerLinkedScene: sceneToCopy.timerLinkedScene ?? null,
    defaultActionRefs: sceneToCopy.defaultActionRefs ?? [],
    timerActionRefs: sceneToCopy.timerActionRefs ?? [],
    background: sceneToCopy.background ?? null,
  };
  const dbScene = new Scene(newScene);
  await dbScene.save();

  //find where scene originally sits in scenes array
  const { scenes: sceneIds = [] } =
    (await Scenario.findById(scenarioId, { scenes: 1 }).lean()) ?? {};
  //positions duplicate either right after original or at end of array
  const position =
    sceneIds.findIndex((id) => id.equals(sceneId)) + 1 || sceneIds.length;

  await Scenario.updateOne(
    { _id: scenarioId },
    { $push: { scenes: { $each: [dbScene._id], $position: position } } }
  );

  const fileRefDeltas = computeCreateFileRefDeltas(
    dbScene.components,
    dbScene.background
  );
  await applyReferenceDeltas(fileRefDeltas);

  return dbScene;
};

/**
 * Increments the scene's visted field
 * @param {String} sceneId MongoDB ID of scenario
 * @returns nothing
 */
export const incrementVisisted = async (sceneId) => {
  await Scene.updateOne({ _id: sceneId }, { $inc: { visited: 1 } });
};

/**
 * Retrieves component from scene based on ID
 * @param {String} sceneId
 * @param {String} componentId
 * @returns component
 */
export const getComponent = async (sceneId, componentId) => {
  const dbScene = await Scene.findById(sceneId);
  const component = dbScene.components.find((c) => c.id === componentId);

  if (!component) {
    throw new HttpError("Component does not exist", status.BAD_REQUEST);
  }

  return component;
};

/**
 * Updates the order of scenes in a scenario
 * @param {String} scenarioId MongoDB ID of scenario
 * @param {String[]} sceneIds Array of scene IDs in the new order
 * @returns {Promise<Object>} updated scenario object
 */
export const updateSceneOrder = async (scenarioId, sceneIds) => {
  const scenario = await Scenario.findById(scenarioId, { scenes: 1 }).lean();
  if (!scenario) return null;

  const currentSceneIds = scenario.scenes.map((id) => id.toString());
  if (sceneIds.length !== currentSceneIds.length) return null;

  const seen = new Set();
  const invalid = sceneIds.some((id) => {
    const idString = id.toString();
    if (seen.has(idString)) return true;
    seen.add(idString);
    return !currentSceneIds.includes(idString);
  });

  if (invalid) return null;

  const updatedScenario = await Scenario.findOneAndUpdate(
    {
      _id: scenarioId,
      scenes: scenario.scenes,
    },
    { scenes: sceneIds },
    { new: true }
  );

  return updatedScenario ?? null;
};

async function validateBackground(background) {
  if (background == null) return null;

  if (typeof background !== "object") {
    throw new HttpError(
      "background must be an object or null",
      status.BAD_REQUEST
    );
  }

  try {
    const validationScene = new Scene({
      name: "Background validation",
      components: [],
      background,
    });
    await validationScene.background.validate();
    return validationScene.background.toObject();
  } catch (error) {
    throw new HttpError(
      `invalid background: ${error.message}`,
      status.BAD_REQUEST
    );
  }
}

function buildDeleteOp(sceneId, field, items) {
  return {
    updateOne: {
      filter: { _id: sceneId },
      update: {
        $pull: {
          [field]: { id: { $in: items } },
        },
      },
    },
  };
}

// builds the update-if-present/push-if-not-present op pair for each item
// against an id-keyed array field (e.g. actions[] or components[])
const buildUpsertByIdOps = (sceneId, field, items) =>
  items.flatMap((item) => [
    {
      updateOne: {
        filter: { _id: sceneId, [`${field}.id`]: item.id },
        update: { $set: { [`${field}.$`]: item } },
      },
    },
    {
      updateOne: {
        filter: { _id: sceneId, [`${field}.id`]: { $ne: item.id } },
        update: { $push: { [field]: item } },
      },
    },
  ]);

function getEffectiveArray({ upserted = [], deleted = [] }, existing) {
  const deletedIdSet = new Set(deleted);
  const upsertedIdSet = new Set(upserted.map((i) => i.id));
  return [
    ...(existing ?? []).filter(
      (i) => !deletedIdSet.has(i.id) && !upsertedIdSet.has(i.id)
    ),
    ...upserted,
  ];
}

const SIMPLE_FIELDS = [
  "name",
  "roles",
  "time",
  "background",
  "defaultLinkedScene",
  "timerLinkedScene",
];

/**
 * Patches a scene object using a structured diff.
 *
 * @param {string} sceneId - The scene ID to patch.
 * @param {object} patch - Structured diff to apply to the scene.
 * @param {string} scenarioId - The scenario ID the scene belongs to.
 * @returns {void}
 */
export async function patchScene(sceneId, patch, scenarioId) {
  const {
    fields = {},
    components = { upserted: [], deleted: [] },
    actions = { upserted: [], deleted: [] },
    defaultActionRefs = { upserted: [], deleted: [] },
    timerActionRefs = { upserted: [], deleted: [] },
  } = patch;

  const allowedFields = {};
  SIMPLE_FIELDS.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(fields, field)) {
      allowedFields[field] = fields[field];
    }
  });

  if (Object.prototype.hasOwnProperty.call(allowedFields, "background"))
    allowedFields.background = await validateBackground(
      allowedFields.background
    );

  const existingScene = await Scene.findById(sceneId, {
    components: 1,
    background: 1,
    actions: 1,
    defaultActionRefs: 1,
    timerActionRefs: 1,
    defaultLinkedScene: 1,
    timerLinkedScene: 1,
  });
  if (!existingScene)
    throw new HttpError("scene not found", HttpStatusCode.NotFound);
  const existing = existingScene.toObject();

  // patch scene link validation. as with action refs, a link left unchanged
  // from what's stored is allowed through even if its target scene has since
  // been deleted

  for (const field of ["defaultLinkedScene", "timerLinkedScene"]) {
    const value = allowedFields[field];
    if (value == null || String(value) === String(existing[field])) continue;
    if (!mongoose.isObjectIdOrHexString(value))
      throw new HttpError(`invalid ${field}`, HttpStatusCode.BadRequest);
    await assertScenesInScenario(scenarioId, [value]);
  }

  // patch action validation

  const effectiveActions = getEffectiveArray(actions, existingScene.actions);
  if (actions.upserted.length) {
    await assertActionsContentValid(
      scenarioId,
      actions.upserted,
      existing.actions
    );
    assertActionsUnique(effectiveActions);
  }

  const validActionIds = effectiveActions.map((action) => action.id);

  const existingComponentsById = new Map(
    (existing.components ?? []).map((c) => [c.id, c])
  );

  const changedLinkedScenes = components.upserted
    .filter(
      (c) =>
        c.linkedScene != null &&
        String(c.linkedScene) !==
          String(existingComponentsById.get(c.id)?.linkedScene)
    )
    .map((c) => c.linkedScene);
  for (const id of changedLinkedScenes) {
    if (!mongoose.isObjectIdOrHexString(id))
      throw new HttpError(
        "invalid component linkedScene",
        HttpStatusCode.BadRequest
      );
  }
  await assertScenesInScenario(scenarioId, changedLinkedScenes);

  const refLists = [
    [
      "defaultActionRefs",
      defaultActionRefs.upserted,
      existing.defaultActionRefs,
    ],
    ["timerActionRefs", timerActionRefs.upserted, existing.timerActionRefs],
    ...components.upserted
      .filter((c) => c.actionRefs !== undefined)
      .map((c) => [
        `component "${c.id}" actions`,
        c.actionRefs,
        existingComponentsById.get(c.id)?.actionRefs,
      ]),
  ];
  for (const [label, refs, existingRefs] of refLists) {
    assertActionRefsShape(refs, label);
    assertActionRefsResolve(refs, existingRefs, validActionIds, label);
  }

  // file ref computation
  const fileRefDeltas = computePatchFileRefDeltas(
    components,
    existingScene.components
  );
  if (Object.prototype.hasOwnProperty.call(allowedFields, "background")) {
    addBackgroundPatchFileRefDeltas(
      fileRefDeltas,
      existingScene.background,
      allowedFields.background
    );
  }

  // bulk operations generation

  const operations = [];

  if (Object.keys(allowedFields).length > 0) {
    operations.push({
      updateOne: {
        filter: { _id: sceneId },
        update: { $set: allowedFields },
      },
    });
  }

  operations.push(
    ...buildUpsertByIdOps(sceneId, "components", components.upserted)
  );
  if (components.deleted.length > 0)
    operations.push(buildDeleteOp(sceneId, "components", components.deleted));

  operations.push(...buildUpsertByIdOps(sceneId, "actions", actions.upserted));
  if (actions.deleted.length > 0)
    operations.push(buildDeleteOp(sceneId, "actions", actions.deleted));

  operations.push(
    ...buildUpsertByIdOps(
      sceneId,
      "defaultActionRefs",
      defaultActionRefs.upserted
    )
  );
  if (defaultActionRefs.deleted.length > 0)
    operations.push(
      buildDeleteOp(sceneId, "defaultActionRefs", defaultActionRefs.deleted)
    );

  operations.push(
    ...buildUpsertByIdOps(sceneId, "timerActionRefs", timerActionRefs.upserted)
  );
  if (timerActionRefs.deleted.length > 0)
    operations.push(
      buildDeleteOp(sceneId, "timerActionRefs", timerActionRefs.deleted)
    );

  // bulk write
  if (operations.length > 0)
    await Scene.bulkWrite(operations, { ordered: true });
  await applyReferenceDeltas(fileRefDeltas);

  return Scene.findById(sceneId);
}
