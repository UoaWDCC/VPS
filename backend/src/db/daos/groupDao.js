import Group from "../models/group.js";
import { HttpError } from "../../util/error.js";

/**
 * Retrieves a group by its MongoDB ID.
 *
 * @param {string} groupId - MongoDB ID of the group.
 * @returns {Promise<object|null>} The matching group object, or null if it does not exist.
 */
export const getGroup = async (groupId) => {
  const group = await Group.findById(groupId);
  return group;
};

/**
 * Retrieves all groups for a given scenario.
 *
 * @param {string} scenarioId - MongoDB ID of the parent scenario.
 * @returns {Promise<Array<object>>} The database group objects for that scenario.
 */
export const getGroupByScenarioId = async (SId) => {
  return Group.find({ scenarioId: SId });
};

/**
 * Creates a group in the database.
 *
 * @param {string} scenarioId - MongoDB ID of the parent scenario.
 * @param {Array<object>} userList - List of user entries for the group.
 * @returns {Promise<object>} The created group document.
 */
export const createGroup = async (scenarioId, userList) => {
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
 * Removes a single user from a group's member list by email.
 *
 * @param {string} groupId - MongoDB ID of the group.
 * @param {string} scenarioId - ID of the scenario the group must belong to.
 * @param {string} email - Email address of the user to remove.
 * @returns {Promise<object|null>} The updated group document, or null if no matching group exists.
 */
export const removeUserFromGroup = async (groupId, scenarioId, email) => {
  const escapedEmail = email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const group = await Group.findOneAndUpdate(
    { _id: groupId, scenarioId },
    {
      $pull: {
        users: { email: { $regex: `^${escapedEmail}$`, $options: "i" } },
      },
    },
    { new: true }
  );
  return group;
};

/**
 * Sets the state variables for a group.
 *
 * @param {string} groupId - MongoDB ID of the group.
 * @param {object} stateVariables - Object containing the state variables to set.
 * @returns {Promise<Array>} A tuple containing the updated state variables and version.
 */
export const setGroupStateVariables = async (groupId, stateVariables) => {
  const group = await Group.findOneAndUpdate(
    { _id: groupId },
    {
      $set: { stateVariables },
      $inc: { stateVersion: 1 },
    },
    { new: true }
  );

  if (!group) {
    throw new HttpError("group not found", 404);
  }

  return [group.stateVariables, group.stateVersion];
};
