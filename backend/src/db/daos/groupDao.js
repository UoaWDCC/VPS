import mongoose from "mongoose";

import Group from "../models/group";
import Scene from "../models/scene";

const getGroup = async (groupId) => {
  return Group.findById(groupId);
};

const getCurrentScene = async (groupId) => {
  const { path } = await Group.findById(groupId, "path");
  if (!path.length) return null;
  return Scene.findById(path[0]);
};

const addSceneToPath = async (groupId, sceneId) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    await Group.findByIdAndUpdate(
      groupId,
      { $push: { path: { $each: [sceneId], $position: 0 } } },
      { session }
    );
    await session.commitTransaction();
  } catch (error) {
    // if another transaction is happening, abort
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Creates a group in the database,
 * @param {Map{String: String}} map of user_id: role
 * @param {Map{String: Array}} map of role: array of notes
 * @param {Array[String]} array of scene
 * @returns the created database group object
 */
const createGroup = async (scenarioId, userList) => {
  const dbGroup = new Group({
    users: userList,
    notes: new Map(),
    path: [],
    scenarioId,
  });
  await dbGroup.save();
  return dbGroup;
};

export { getGroup, getCurrentScene, addSceneToPath, createGroup };
