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

// eslint-disable-next-line import/prefer-default-export
export { createScene };
