import Staff from "../models/staff";

/**
 * Retrieves all the authorised staff stored in the database
 * @param fid = firebase user id
 * @returns list of database authorise staff objects
 */
const retrieveAuthorisedStaffList = async (fid) => {
  return Staff.find({ firebaseID: fid });
};

export default retrieveAuthorisedStaffList;
