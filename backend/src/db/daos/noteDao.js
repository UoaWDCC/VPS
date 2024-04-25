import Note from "../models/note";

const createNote = async (groupId, name) => {
  const dbScene = new Note(scene);
  await dbScene.save();

  await Scenario.updateOne(
    { _id: scenarioId },
    { $push: { scenes: dbScene._id } }
  );

  return dbScene;
};

