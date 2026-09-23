import Access from "../models/access.js";
import User from "../models/user.js";

/**
 * Retrieves the access list for a scenario, or returns an empty list stub.
 *
 * @param {string} scenarioId - The scenario ID to look up.
 * @returns {Promise<object>} The access document, or an empty access stub.
 */
export const getAccessList = async (scenarioId) => {
  const access = await Access.findOne({ scenarioId });
  return access || { scenarioId, accessList: [] };
};

/**
 * Checks whether a user has access to a scenario.
 *
 * @param {string} scenarioId - The scenario ID to check.
 * @param {string} uid - The Firebase user ID to test.
 * @returns {Promise<boolean>} True when the user is allowed to access the scenario.
 */
export const hasAccess = async (scenarioId, uid) => {
  const user = await User.findOne({ uid }, { email: 1 }).lean();
  if (!user) return false;
  const access = await getAccessList(scenarioId);
  return access.accessList.includes(user.email);
};

/**
 * Adds an email address to the access list for a scenario.
 *
 * @param {string} scenarioId - The scenario ID to update.
 * @param {string} email - The email address to grant access to.
 * @returns {Promise<object>} The updated access document.
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
 * Removes the access list for a scenario.
 *
 * @param {string} scenarioId - The scenario ID to clear.
 * @returns {Promise<object|null>} The deleted access document, or null.
 */
export const deleteAccessList = async (scenarioId) => {
  return await Access.findOneAndDelete({ scenarioId });
};

/**
 * Revokes access for one or more emails on a scenario.
 *
 * @param {string} scenarioId - The scenario ID to update.
 * @param {string[]} emails - The email addresses to remove.
 * @returns {Promise<object|null>} The updated access document.
 */
export const revokeAccess = async (scenarioId, emails) => {
  const access = await Access.findOneAndUpdate(
    { scenarioId },
    { $pull: { accessList: { $in: emails } } },
    { new: true }
  );
  return access;
};
