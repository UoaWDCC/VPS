/* eslint-disable no-underscore-dangle */
import Scene from "../models/scene";
import Scenario from "../models/scenario";

const createScene = async (scenarioId, name) => {
  const dbScene = new Scene({
    name,
  });
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

// eslint-disable-next-line import/prefer-default-export
export { createScene, retrieveSceneList, retrieveScene };
