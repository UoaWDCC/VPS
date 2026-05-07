import Scene from "../models/scene.js";
import Scenario from "../models/scenario.js";
import { tryDeleteFile, updateFileMetadata } from "../../firebase/storage.js";
import { HttpError } from "../../util/error.js";
import status from "../../util/status.js";

/**
 * Creates a scene in the database, and updates its parent scenario to contain the scene
 * @param {String} scenarioId MongoDB ID of parent scenario
 * @param {{name: String, components: Object[]}, time: Number} scene scene object
 * @returns the created database scene object
 */
const createScene = async (scenarioId, scene) => {
  const dbScene = new Scene(scene);
  await dbScene.save();

  await Scenario.updateOne(
    { _id: scenarioId },
    { $push: { scenes: dbScene._id } }
  );

  return dbScene;
};

/**
 * Retrieves all scenes of a scenario
 * @param {String} scenarioId MongoDB ID of scenario
 * @returns list of database scene objects
 */
const retrieveSceneList = async (scenarioId) => {
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
const retrieveScene = async (sceneId) => {
  const dbScene = await Scene.findById(sceneId);

  return dbScene;
};

/**
 * Updates a scene in the database
 * @param {String} sceneId MongoDB ID of scene
 * @param {{name: String, components: Object[]}, time: Number} updatedScene updated scene object
 * @returns updated database scene object
 */
const updateScene = async (sceneId, updatedScene) => {
  // makes sure when we update components is not null
  if (updatedScene.components) {
    const prevDbScene = await Scene.findById(sceneId);

    // if previous firebase media component no longer exists, try to delete file from firebase storage
    prevDbScene.components.forEach((c) => {
      if (c.type === "image" || c.type === "audio") {
        // checks for non-existance in new components array
        if (!updatedScene.components.some((newC) => newC.id === c.id)) {
          tryDeleteFile(c.href ?? c.url);
        }
      }
    });

    const dbScene = await Scene.findOneAndUpdate(
      { _id: sceneId },
      updatedScene,
      { new: true }
    );

    return dbScene;
  }

  // if we are updating name only, components will be null
  let dbScene = await Scene.findById(sceneId);

  // store temp variable incase new name is invalid
  const previousName = dbScene.name;

  // is new name empty or null?
  if (dbScene.name === "" || dbScene.name === null) {
    updatedScene.name = previousName;
  }

  dbScene = await Scene.updateOne({ _id: sceneId }, updatedScene, {
    new: true,
  });
  console.log(dbScene);
  return dbScene;
};

/**
 * Deletes a scene from the database, and removes it from its parent scenario
 * @param {String} scenarioId MongoDB ID of scenario
 * @param {String} sceneId MongoDB ID of scene
 * @returns {Promise<Boolean>} true if scene was deleted, false otherwise
 */
const deleteScene = async (scenarioId, sceneId) => {
  const scenarioRes = await Scenario.findOneAndUpdate(
    { _id: scenarioId },
    { $pull: { scenes: sceneId } }
  );
  if (!scenarioRes) {
    return false;
  }

  const res = await Scene.findOneAndDelete({ _id: sceneId });
  return res !== null;
};

/**
 * Duplicates a scene in the database and updates its parent scenario to contain the new scene
 * @param {String} scenarioId MongoDB ID of scenario
 * @param {String} sceneId MongoDB ID of scene
 * @returns duplicated database scene object
 */
const duplicateScene = async (scenarioId, sceneId) => {
  const sceneToCopy = await Scene.findById(sceneId);
  const newScene = {
    name: `${sceneToCopy.name} Copy`,
    components: sceneToCopy.components,
    time: sceneToCopy.time,
  };
  const dbScene = new Scene(newScene);
  await dbScene.save();

  dbScene.components.forEach((c) => {
    if (c.type === "image" || c.type === "audio") {
      updateFileMetadata(c.url);
    }
  });

  await Scenario.updateOne(
    { _id: scenarioId },
    { $push: { scenes: dbScene._id } }
  );

  return dbScene;
};

/**
 * Increments the scene's visted field
 * @param {String} sceneId MongoDB ID of scenario
 * @returns nothing
 */
const incrementVisisted = async (sceneId) => {
  const prevDbScene = await Scene.findById(sceneId);
  const countVisited = prevDbScene.visited;
  await Scene.updateOne({ _id: sceneId }, { visited: countVisited + 1 });
};

/**
 * Retrieves component from scene based on ID
 * @param {String} sceneId
 * @param {String} componentId
 * @returns component
 */
const getComponent = async (sceneId, componentId) => {
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
const updateSceneOrder = async (scenarioId, sceneIds) => {
  const updatedScenario = await Scenario.findOneAndUpdate(
    { _id: scenarioId },
    { scenes: sceneIds },
    { new: true }
  );

  return updatedScenario;
};

const patchScene = async (sceneId, patch) => {
  const { fields = {}, components = [], deletedComponentIds = [] } = patch;

  const allowedFields = {};
  ["name", "roles", "time"].forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(fields, field)) {
      allowedFields[field] = fields[field];
    }
  });

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

  return Scene.findById(sceneId);
};

export {
  createScene,
  retrieveSceneList,
  retrieveScene,
  patchScene,
  deleteScene,
  updateScene,
  duplicateScene,
  incrementVisisted,
  getComponent,
  updateSceneOrder,
};
