import Group from '../models/group';
import Scene from '../models/scene';

const getGroup = async (groupId) => {
    return await Group.findById(groupId);
}

const getCurrentScene = async (groupId) => {
  try {
    const group = await Group.findById(groupId);
    if (!group) {
      throw new Error('Group not found');
    }
    const path = group.path;
    if (!path || path.length === 0) {
      throw new Error('Path not set for this group');
    }
    const currentSceneId = path[path.length - 1];
    const currentScene = await Scene.findById(currentSceneId);
    if (!currentScene) {
      throw new Error('Current scene not found');
    }
    return currentScene;
  } catch(error) {
    throw error;
  }
};

const addSceneToPath = async (groupId, sceneId) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const group = await Group.findById(groupId).session(session);
    if (!group) {
      throw new Error('Group not found');
    }
    group.scenes.push(sceneId);
    await group.save({ session });
    await session.commitTransaction();
  } catch (error) {
    // if another transaction has been commited, abort 
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export { getGroup, getCurrentScene, addSceneToPath };