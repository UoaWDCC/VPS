import Group from '../models/group';
import Scene from '../models/scene';

const getGroup = async (groupId) => {
    return await Group.findById(groupId);
}

const getCurrentScene = async (groupId) => {
    const group = await Group.findById(groupId);
    if(!group) {
      throw new Error('Group not Found');
    }
    const currentSceneId = group.currentScene;
    if(!currentSceneId) {
      throw new Error('Current Scene not set for this group');
    }
    const currentScene = await Scene.findById(currentSceneId);
    if(!currentScene) {
      throw new Error('Current scene not found');
    }
    return currentScene;
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