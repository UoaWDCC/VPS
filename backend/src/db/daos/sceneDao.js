import Scene from "../models/scene.js";
import Scenario from "../models/scenario.js";
import { HttpError } from "../../util/error.js";
import status from "../../util/status.js";
import { applyReferenceDeltas } from "./fileDao.js";
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

/**
 * Calculates the file reference deltas created by a scene's components.
 *
 * @param {Array<object>} [components=[]] - The scene components to inspect.
 * @returns {Map<string, number>} The resulting reference delta map.
 */
function computeCreateFileRefDeltas(components) {
  const fileRefDeltas = new Map();
  (components ?? []).forEach((component) => {
    if (hasFileRef(component)) {
      addDelta(fileRefDeltas, component.fileId, 1);
    }
  });
  return fileRefDeltas;
}

/**
 * Calculates the file reference deltas removed by deleting scene components.
 *
 * @param {Array<object>} [components=[]] - The scene components being removed.
 * @returns {Map<string, number>} The resulting reference delta map.
 */
function computeDeleteFileRefDeltas(components) {
  const fileRefDeltas = new Map();
  (components ?? []).forEach((component) => {
    if (hasFileRef(component)) {
      addDelta(fileRefDeltas, component.fileId, -1);
    }
  });
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

// enforce direct links between scenes to be in the same scenario
const assertDirectLinkInScenario = async (scenarioId, directLinkId) => {
  if (directLinkId == null) return;
  const inScenario = await Scenario.exists({
    _id: scenarioId,
    scenes: directLinkId,
  });
  if (!inScenario) {
    throw new HttpError(
      "directLink target must belong to the same scenario",
      status.BAD_REQUEST
    );
  }
};

/**
 * Creates a scene in the database, and updates its parent scenario to contain the scene
 * @param {String} scenarioId MongoDB ID of parent scenario
 * @param {{name: String, components: Object[]}, time: Number} scene scene object
 * @returns the created database scene object
 */
export const createScene = async (scenarioId, scene) => {
  if (scene.directLink == null) {
    const scenarioExists = await Scenario.exists({ _id: scenarioId });
    if (!scenarioExists) {
      throw new HttpError("scenario not found", status.NOT_FOUND);
    }
  }

  await assertDirectLinkInScenario(scenarioId, scene.directLink);

  const fileRefDeltas = computeCreateFileRefDeltas(scene.components);
  const dbScene = new Scene(scene);

  try {
    await dbScene.save();

    const scenarioUpdate = await Scenario.updateOne(
      { _id: scenarioId },
      { $push: { scenes: dbScene._id } }
    );

    if (scenarioUpdate.matchedCount === 0) {
      await Scene.deleteOne({ _id: dbScene._id });
      throw new HttpError("scenario not found", status.NOT_FOUND);
    }

    await applyReferenceDeltas(fileRefDeltas);
    return dbScene;
  } catch (error) {
    if (dbScene._id) {
      await Promise.all([
        Scene.deleteOne({ _id: dbScene._id }),
        Scenario.updateOne(
          { _id: scenarioId },
          { $pull: { scenes: dbScene._id } }
        ),
        applyReferenceDeltas(
          new Map(
            Array.from(fileRefDeltas.entries()).map(([fileId, delta]) => [
              fileId,
              -delta,
            ])
          )
        ),
      ]).catch(() => {});
    }
    throw error;
  }
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
    { directLink: sceneId },
    { $set: { directLink: null } }
  );
  const res = await Scene.findOneAndDelete({ _id: sceneId });

  if (res) {
    const fileRefDeltas = computeDeleteFileRefDeltas(res.components);
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
    directLink: sceneToCopy.directLink ?? null,
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

  const fileRefDeltas = computeCreateFileRefDeltas(dbScene.components);
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
    { _id: scenarioId },
    { scenes: sceneIds },
    { new: true }
  );

  return updatedScenario;
};

export const patchScene = async (sceneId, patch, scenarioId) => {
  const { fields = {}, components = [], deletedComponentIds = [] } = patch;

  const allowedFields = {};
  ["name", "roles", "time", "directLink", "timerStateOperations"].forEach(
    (field) => {
      if (Object.prototype.hasOwnProperty.call(fields, field)) {
        allowedFields[field] = fields[field];
      }
    }
  );

  if ("directLink" in allowedFields) {
    await assertDirectLinkInScenario(scenarioId, allowedFields.directLink);
  }

  const existingScene = await Scene.findById(sceneId, { components: 1 });
  if (!existingScene)
    throw new HttpError("scene not found", HttpStatusCode.NotFound);

  const fileRefDeltas = computePatchFileRefDeltas(
    existingScene.components,
    components,
    deletedComponentIds
  );

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
    // Update existing component
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

    // Insert component if it does not already exist
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
