import Group from "../models/group";
import Scene from "../models/scene";

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

export { getGroup, getCurrentScene, createGroup, getGroupByScenarioId };
