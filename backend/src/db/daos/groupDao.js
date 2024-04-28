import Group from '../models/group';
import Scene from '../models/scene';
import mongoose from 'mongoose';

const getGroup = async (groupId) => {
    return await Group.findById(groupId);
}

const getCurrentScene = async (groupId) => {
    const group = await Group.findById(groupId);
    const path = group.path;
    if (!path.length) return null;
    return await Scene.findById(path[path.length - 1]);
};

const addSceneToPath = async (groupId, sceneId) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const group = await Group.findById(groupId).session(session);
    group.path.push(sceneId);
    await group.save({ session });
    await session.commitTransaction();
  } catch (error) {
    // if another transaction is happening, abort 
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export { getGroup, getCurrentScene, addSceneToPath };