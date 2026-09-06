import Scene from "../models/scene.js";
import Scenario from "../models/scenario.js";
import { HttpError } from "../../util/error.js";
import status from "../../util/status.js";
import { applyReferenceDeltas } from "./fileDao.js";
import { getProperties } from "./scenarioDao.js";
import {
  isValidOperation,
  isValidComparator,
} from "../../util/properties/propertyTypes.js";
import { HttpStatusCode } from "axios";

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
 * @param {Array<object>} [existingComponents=[]] - The scene's previous components.
 * @param {Array<object>} modifiedComponents - The updated component list.
 * @param {Array<string>} deletedComponentIds - IDs removed in the patch.
 * @returns {Map<string, number>} The resulting reference delta map.
 */
function computePatchFileRefDeltas(
  existingComponents,
  modifiedComponents,
  deletedComponentIds
) {
  const existingComponentsById = new Map(
    (existingComponents ?? []).map((c) => [c.id, c])
  );

  const fileRefDeltas = new Map();

  deletedComponentIds.forEach((id) => {
    const existing = existingComponentsById.get(id);
    if (hasFileRef(existing)) addDelta(fileRefDeltas, existing.fileId, -1);
  });

  modifiedComponents.forEach((component) => {
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

// validate that each action's conditions/operations reference a real
// property, using a comparator/operation that's legal for its type
const assertActionsMatchPropertyTypes = (actions, properties) => {
  const propertiesById = new Map(properties.map((p) => [p.id, p]));

  for (const action of actions) {
    for (const condition of action.conditions ?? []) {
      const property = propertiesById.get(condition.stateVariableId);
      if (!property) {
        throw new HttpError(
          `Condition references unknown property "${condition.stateVariableId}"`,
          status.BAD_REQUEST
        );
      }
      if (!isValidComparator(property.type, condition.comparator)) {
        throw new HttpError(
          `Invalid comparator ${condition.comparator} for property type ${property.type}`,
          status.BAD_REQUEST
        );
      }
    }

    for (const operation of action.operations ?? []) {
      const property = propertiesById.get(operation.stateVariableId);
      if (!property) {
        throw new HttpError(
          `Operation references unknown property "${operation.stateVariableId}"`,
          status.BAD_REQUEST
        );
      }
      if (!isValidOperation(property.type, operation.operation)) {
        throw new HttpError(
          `Invalid operation ${operation.operation} for property type ${property.type}`,
          status.BAD_REQUEST
        );
      }
    }
  }
};

// reject an action-id reference (defaultActionIds/timerActionIds/a
// component's actions) that doesn't resolve against the scene's actions[]
const assertActionIdsResolve = (actionIds, validIds, label) => {
  if (!actionIds?.length) return;
  const validIdSet = new Set(validIds);
  const danglingId = actionIds.find((id) => !validIdSet.has(id));
  if (danglingId) {
    throw new HttpError(
      `${label} references unknown action id "${danglingId}"`,
      status.BAD_REQUEST
    );
  }
};

// validates an actions[] list on its own terms: unique names, linkedScene
// targets stay in the scenario, and conditions/operations match their
// property's type
const assertActionsContentValid = async (scenarioId, actions) => {
  const linkedSceneIds = actions
    .map((action) => action.linkedScene)
    .filter(Boolean);
  await assertScenesInScenario(scenarioId, linkedSceneIds);

  if (actions.length) {
    assertUniqueActionNames(actions);
    const properties = await getProperties(scenarioId);
    assertActionsMatchPropertyTypes(actions, properties);
  }
};

// validates that defaultActionIds/timerActionIds/each component's actions
// resolve against the given actions[]; ids that are absent/empty are a no-op
// (handled by assertActionIdsResolve), so callers can pass values that
// weren't part of a given write without special-casing them
const assertActionReferencesResolve = (
  validActionIds,
  { defaultActionIds, timerActionIds, components }
) => {
  assertActionIdsResolve(defaultActionIds, validActionIds, "defaultActionIds");
  assertActionIdsResolve(timerActionIds, validActionIds, "timerActionIds");
  (components ?? []).forEach((component) => {
    assertActionIdsResolve(
      component.actions,
      validActionIds,
      `component "${component.id}" actions`
    );
  });
};

/**
 * Creates a scene in the database, and updates its parent scenario to contain the scene
 * @param {String} scenarioId MongoDB ID of parent scenario
 * @param {{name: String, components: Object[]}, time: Number} scene scene object
 * @returns the created database scene object
 */
export const createScene = async (scenarioId, scene) => {
  const scenarioExists = await Scenario.exists({ _id: scenarioId });
  if (!scenarioExists) {
    throw new HttpError("scenario not found", status.NOT_FOUND);
  }

  const actions = scene.actions ?? [];
  await assertActionsContentValid(scenarioId, actions);

  const validActionIds = actions.map((action) => action.id);
  assertActionReferencesResolve(validActionIds, {
    defaultActionIds: scene.defaultActionIds,
    timerActionIds: scene.timerActionIds,
    components: scene.components,
  });

  const dbScene = new Scene(scene);

  await dbScene.save();

  await Scenario.updateOne(
    { _id: scenarioId },
    { $push: { scenes: dbScene._id } }
  );

  const fileRefDeltas = computeCreateFileRefDeltas(
    dbScene.components,
    dbScene.background
  );
  await applyReferenceDeltas(fileRefDeltas);

  return dbScene;
};

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

  await Scene.updateMany(
    { "actions.linkedScene": sceneId },
    { $set: { "actions.$[elem].linkedScene": null } },
    { arrayFilters: [{ "elem.linkedScene": sceneId }] }
  );
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
    defaultActionIds: sceneToCopy.defaultActionIds ?? [],
    timerActionIds: sceneToCopy.timerActionIds ?? [],
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

export const patchScene = async (sceneId, patch, scenarioId) => {
  const { fields = {}, components = [], deletedComponentIds = [] } = patch;

  const allowedFields = {};
  [
    "name",
    "roles",
    "time",
    "actions",
    "defaultActionIds",
    "timerActionIds",
    "background",
  ].forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(fields, field)) {
      allowedFields[field] = fields[field];
    }
  });

  if (Object.prototype.hasOwnProperty.call(allowedFields, "background")) {
    allowedFields.background = await validateBackground(
      allowedFields.background
    );
  }

  const existingScene = await Scene.findById(sceneId, {
    components: 1,
    background: 1,
    actions: 1,
  });
  if (!existingScene) {
    throw new HttpError("scene not found", HttpStatusCode.NotFound);
  }

  if ("actions" in allowedFields) {
    await assertActionsContentValid(scenarioId, allowedFields.actions);
  }

  const effectiveActions =
    "actions" in allowedFields
      ? allowedFields.actions
      : (existingScene.actions ?? []);
  const validActionIds = effectiveActions.map((action) => action.id);

  assertActionReferencesResolve(validActionIds, {
    defaultActionIds: allowedFields.defaultActionIds,
    timerActionIds: allowedFields.timerActionIds,
    components,
  });

  const fileRefDeltas = computePatchFileRefDeltas(
    existingScene.components,
    components,
    deletedComponentIds
  );
  if (Object.prototype.hasOwnProperty.call(allowedFields, "background")) {
    addBackgroundPatchFileRefDeltas(
      fileRefDeltas,
      existingScene.background,
      allowedFields.background
    );
  }

  const operations = [];

  if (Object.keys(allowedFields).length > 0) {
    operations.push({
      updateOne: {
        filter: { _id: sceneId },
        update: { $set: allowedFields },
      },
    });
  }

  if (deletedComponentIds.length > 0) {
    operations.push({
      updateOne: {
        filter: { _id: sceneId },
        update: {
          $pull: {
            components: { id: { $in: deletedComponentIds } },
          },
        },
      },
    });
  }

  for (const component of components) {
    operations.push({
      updateOne: {
        filter: {
          _id: sceneId,
          "components.id": component.id,
        },
        update: {
          $set: {
            "components.$": component,
          },
        },
      },
    });

    operations.push({
      updateOne: {
        filter: {
          _id: sceneId,
          "components.id": { $ne: component.id },
        },
        update: {
          $push: {
            components: component,
          },
        },
      },
    });
  }

  if (operations.length > 0) {
    await Scene.bulkWrite(operations, { ordered: true });
  }

  await applyReferenceDeltas(fileRefDeltas);

  return Scene.findById(sceneId);
};
