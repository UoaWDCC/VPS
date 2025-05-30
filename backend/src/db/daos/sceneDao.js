import Scene from "../models/scene.js";
import Scenario from "../models/scenario.js";
import { tryDeleteFile, updateFileMetadata } from "../../firebase/storage.js";

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

  return dbScenes;
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
    // if previous firebase image component no longer exists, try to delete file from firebase storage
    prevDbScene.components.forEach((c) => {
      if (c.type === "FIREBASEIMAGE" || c.type === "FIREBASEAUDIO") {
        // checks for non-existance in new components array
        if (!updatedScene.components.some((newC) => newC.id === c.id)) {
          tryDeleteFile(c.url);
        }
      }
    });
    const dbScene = await Scene.findOneAndUpdate(
      { _id: sceneId },
      updatedScene,
      {
        new: true,
      }
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
    if (c.type === "FIREBASEIMAGE" || c.type === "FIREBASEAUDIO") {
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

export {
  createScene,
  retrieveSceneList,
  retrieveScene,
  deleteScene,
  updateScene,
  duplicateScene,
  incrementVisisted,
};
