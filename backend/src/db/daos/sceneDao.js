/* eslint-disable no-underscore-dangle */
import Scene from "../models/scene";
import Scenario from "../models/scenario";

const createScene = async (scenarioId, scene) => {
  const dbScene = new Scene(scene);
  await dbScene.save();

  await Scenario.updateOne(
    { _id: scenarioId },
    { $push: { scenes: dbScene._id } }
  );

  return dbScene;
};

const retrieveSceneList = async (scenarioId) => {
  const dbScenario = await Scenario.findById(scenarioId);
  const dbScenes = await Scene.find(
    { _id: { $in: dbScenario.scenes } },
    "name"
  );

  return dbScenes;
};

const retrieveScene = async (sceneId) => {
  const dbScene = await Scene.findById(sceneId);

  return dbScene;
};

const updateScene = async (sceneId, updatedScene) => {
  // makes sure when we update components is not null
  if (updatedScene.components) {
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
  const dbScene = await Scene.findById(sceneId);
  dbScene.name = updatedScene.name;
  await dbScene.save();
  return dbScene;
};

const deleteScene = async (scenarioId, sceneId) => {
  const scenarioRes = await Scenario.updateOne(
    { _id: scenarioId },
    { $pull: { scenes: sceneId } }
  );
  if (scenarioRes.n !== 1) {
    return false;
  }

  try {
    const scene = await Scene.findById(sceneId);
    await scene.remove();
    return true;
  } catch (e) {
    return false;
  }
};

const duplicateScene = async (scenarioId, sceneId) => {
  const sceneToCopy = await Scene.findById(sceneId);
  const newScene = {
    name: `${sceneToCopy.name} Copy`,
    components: sceneToCopy.components,
  };
  const dbScene = new Scene(newScene);
  await dbScene.save();

  await Scenario.updateOne(
    { _id: scenarioId },
    { $push: { scenes: dbScene._id } }
  );

  return dbScene;
};

// eslint-disable-next-line import/prefer-default-export
export {
  createScene,
  retrieveSceneList,
  retrieveScene,
  deleteScene,
  updateScene,
  duplicateScene,
};
