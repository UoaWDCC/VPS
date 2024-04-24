import Group from '../models/group';

const getGroup = async (groupId) => {
    return await Group.findById(groupId);
}

const getCurrentScene = async (groupId) => {
    //
}

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