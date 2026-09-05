import Staff from "../models/staff.js";

/**
 * Retrieves all staff records associated with a Firebase user ID.
 *
 * @param {string} fid - Firebase user ID for the staff member.
 * @returns {Promise<Array<object>>} The matching staff records.
 */
export default async function retrieveAuthorisedStaffList(fid) {
  return Staff.find({ firebaseID: fid });
}
