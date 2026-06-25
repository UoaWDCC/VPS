import Access from "../models/access.js";
import User from "../models/user.js";

/**
 *
 * @param {string} scenarioId
 * @returns access object or stub empty object
 */
export const getAccessList = async (scenarioId) => {
  const access = await Access.findOne({ scenarioId });
  return access || { scenarioId, accessList: [] };
};

/**
 *
 * @param {string} scenarioId
 * @returns {boolean}
 */
export const hasAccess = async (scenarioId, uid) => {
  const user = await User.findOne({ uid }, { email: 1 }).lean();
  if (!user) return false;
  const access = await getAccessList(scenarioId);
  return access.accessList.includes(user.email);
};

/**
 *
 * @param {string} scenarioId
 * @param {string} email
 * @returns upserted access object
 */
export const grantAccess = async (scenarioId, email) => {
  const access = await Access.findOneAndUpdate(
    { scenarioId },
    { $addToSet: { accessList: email } },
    { upsert: true, new: true }
  );
  return access;
};

/**
 *
 * @param {string} scenarioId
 * @returns access object
 */
export const deleteAccessList = async (scenarioId) => {
  return await Access.findOneAndDelete({ scenarioId });
};

/**
 *
 * @param {string} scenarioId
 * @param {string[]} emails
 * @returns access object | null
 */
export const revokeAccess = async (scenarioId, emails) => {
  const access = await Access.findOneAndUpdate(
    { scenarioId },
    { $pull: { accessList: { $in: emails } } },
    { new: true }
  );
  return access;
};
