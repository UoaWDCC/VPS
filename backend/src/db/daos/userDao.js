import User from "../models/user.js";
import Scenario from "../models/scenario.js";
import Groups from "../models/group.js";
import { retrieveScenarios } from "./scenarioDao.js";

/**
 * Retrieves all users
 * @returns list of all users in databse
 */
const retrieveAllUser = async () => {
  return User.find();
};

/**
 * Retrieves user based on given uid
 * @param {String} uid unique id of user
 * @returns user object
 */
const retrieveUser = async (uid) => {
  const user = await User.find({ uid });
  return user;
};

/**
 * Retrieves user based on given uid
 * @param {String} email unique email of user
 * @returns user object
 */
const retrieveUserByEmail = async (email) => {
  return User.findOne({ email });
};

const retrievePlayedUsers = async (scenarioId) => {
  const { users: userIds } = await Scenario.findById(scenarioId);
  const users = await User.find({
    uid: { $in: userIds },
  });
  return users;
};

/**
 * Creates a user in the database,
 * @param {Record<String, String>} info user's info
 * @returns the created database user object
 */
const createUser = async (info) => {
  return new User(info).save();
};

/**
 * Deletes a user from the database
 * @param {String} uid user's unique id
 * @returns {Boolean} True if successfully deleted, False if error
 */
const deleteUser = async (uid) => {
  try {
    const user = await User.find({ uid });
    await user.remove();
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * @deprecated 17/09/2024
 * We currently do not support play history - a larger refactor is likely required, at which point,
 * we should support both single and multiplayer
 *
 * Not removing as there are possible regressions not accounted for.
 *
 * Appendings new object "newPlayed" to user's played array and adds the users uid to scenario's user array
 * @param {String} uid user's unique id
 * @param {{scenarioId: String, path: Object[]}} newPlayed user's new played object
 * @param {String} scenarioId the scenario id of the scenario that the played just played
 * @returns {Boolean} True if successfully adding it , False if error
 */
const addPlayed = async (uid, newPlayed, scenarioId) => {
  try {
    // Updates User's Played array, by appending new one

    await User.updateOne({ uid }, { $push: { played: newPlayed } });
    // Updates Scenario's User array, by appending new uer

    await Scenario.updateOne({ _id: scenarioId }, { $push: { users: uid } });
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Adds assignees to the scenario
 * @param {String} scenarioId
 * @param {Array} newAssignees
 * @returns all assignees
 */
const assignScenarioToUsers = async (scenarioId, newAssignees) => {
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
    // eslint-disable-next-line no-console
    console.error(
      "Something went wrong while assigning a user to a scenario:",
      e
    );
    return false;
  }
  return true;
};

/**
 * Finds all assigned scenarios for a user
 * @param {String} userId
 * @returns all assigned scenarios for the user
 */
const retrieveAssignedScenarioList = async (userId) => {
  const user = await User.findOne({ uid: userId });
  if (!user.assigned) return []; // even if list is empty, we may have groups this user is a part of.

  const multiplayerScenarios = await Groups.find(
    { "users.email": user.email },
    { scenarioId: 1, _id: 0 }
  );

  return retrieveScenarios(
    user.assigned.concat(multiplayerScenarios.map((doc) => doc.scenarioId))
  );
};

const fetchScene = async (email, scenarioId) => {
  const user = await User.findOne({ email }, { [`paths.${scenarioId}`]: 1 });
  return (user && user.paths && user.paths.get(scenarioId)[0]) || null;
};

export {
  retrieveAllUser,
  createUser,
  retrieveUser,
  retrieveUserByEmail,
  deleteUser,
  addPlayed,
  retrievePlayedUsers,
  assignScenarioToUsers,
  retrieveAssignedScenarioList,
  fetchScene,
};
