import User from "../models/user";
import Scenario from "../models/scenario";
import { retrieveScenarios } from "./scenarioDao";

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
 * @param {String} name user's name
 * @param {String} uid user's unique id
 * @param {String} email user's email address
 * @param {String} pictureURL URL to user's profile picture
 * @returns the created database user object
 */
const createUser = async (name, uid, email, pictureURL) => {
  const user = await User.find({ uid });
  if (user.length === 0) {
    const dbUser = new User({
      name,
      uid,
      email,
      pictureURL,
    });
    await dbUser.save();
    return dbUser;
  }
  return user;
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
  if (!user.assigned || !user.assigned.length) return [];

  return retrieveScenarios(user.assigned);
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
};
