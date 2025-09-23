import Group from "../models/group.js";
import Scene from "../models/scene.js";

const getGroup = async (groupId) => {
  const group = await Group.findById(groupId);
  return group;
};

const getGroupByScenarioId = async (SId) => {
  return Group.find({ scenarioId: SId });
};

const getCurrentScene = async (groupId) => {
  const group = await Group.findById(groupId);
  const { path } = group;
  if (!path.length) return null;
  return Scene.findById(path[path.length - 1]);
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

/**
 * Sets the state variables for a group
 * @param {String} groupId MongoDB ID of group
 * @param {Object} stateVariables Object containing state variables
 * @returns updated group object with state variables set
 */
const setGroupStateVariables = async (groupId, stateVariables) => {
  try {
    const group = await Group.findOneAndUpdate(
      { _id: groupId },
      {
        $set: { stateVariables },
        $inc: { stateVersion: 1 },
      },
      { new: true }
    );
    if (!group) {
      throw new Error("Group not found");
    }
    return [group.stateVariables, group.stateVersion];
  } catch (error) {
    throw new Error(`Error initiating state variables: ${error.message}`);
  }
};

export {
  getGroup,
  getCurrentScene,
  createGroup,
  getGroupByScenarioId,
  setGroupStateVariables,
};
