import User from "../models/user.js";
import Groups from "../models/group.js";
import { HttpError } from "../../util/error.js";
import { retrieveScenarios } from "./scenarioDao.js";

/**
 * Retrieves a user by email address.
 *
 * @param {string} email - Unique email of the user.
 * @returns {Promise<object|null>} The matching user document, or null.
 */
export const retrieveUserByEmail = async (email) => {
  return User.findOne({ email });
};

/**
 * Creates a user in the database.
 *
 * @param {Record<string, string>} info - User profile data.
 * @returns {Promise<object>} The saved user document.
 */
export const createUser = async (info) => {
  return new User(info).save();
};

/**
 * Adds scenario assignments to a list of users.
 *
 * @param {string} scenarioId - Scenario ID to assign.
 * @param {Array<string>} newAssignees - User IDs to assign to the scenario.
 * @returns {Promise<boolean>} True when assignment succeeds, otherwise false.
 */
export const assignScenarioToUsers = async (scenarioId, newAssignees) => {
  if (!Array.isArray(newAssignees)) {
    return false;
  }

  try {
    await User.updateMany(
      { _id: { $in: newAssignees }, assigned: { $exists: true } },
      {
        $addToSet: { assigned: scenarioId },
      }
    );

    await User.updateMany(
      { _id: { $in: newAssignees }, assigned: { $exists: false } },
      {
        $set: { assigned: [scenarioId] },
      }
    );
  } catch (e) {
    console.error(
      "Something went wrong while assigning a user to a scenario:",
      e
    );
    return false;
  }
  return true;
};

/**
 * Finds all scenarios assigned to a user, including multiplayer group memberships.
 *
 * @param {string} userId - The Firebase user ID to look up.
 * @returns {Promise<Array<object>>} The assigned scenario objects for the user.
 */
export const retrieveAssignedScenarioList = async (userId) => {
  const user = await User.findOne({ uid: userId });
  if (!user?.assigned) return []; // even if list is empty, we may have groups this user is a part of.

  const multiplayerScenarios = await Groups.find(
    { "users.email": user.email },
    { scenarioId: 1, _id: 0 }
  );

  return retrieveScenarios(
    user.assigned.concat(multiplayerScenarios.map((doc) => doc.scenarioId))
  );
};

/**
 * Sets the properties for a user within a scenario.
 *
 * @param {string} userId - The MongoDB user ID.
 * @param {string} scenarioId - The scenario ID associated with the properties.
 * @param {object} properties - The property payload to persist.
 * @returns {Promise<Array>} A tuple containing the updated properties and version.
 */
export const setUserProperties = async (userId, scenarioId, properties) => {
  const user = await User.findOneAndUpdate(
    { _id: userId },
    {
      $set: {
        [`stateVariables.${scenarioId}`]: properties,
      },
      $inc: {
        [`stateVersions.${scenarioId}`]: 1,
      },
    },
    { new: true }
  );

  if (!user) {
    throw new HttpError("user not found", 404);
  }

  return [
    user.stateVariables.get(scenarioId),
    user.stateVersions.get(scenarioId),
  ];
};
