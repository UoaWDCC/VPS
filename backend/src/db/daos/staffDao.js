import Staff from "../models/staff";

/**
 * Retrieves all the authorised staff stored in the database
 * @returns list of database authorise staff objects
 */
const retrieveAuthorisedStaffList = async () => {
  return Staff.find();
};

export default retrieveAuthorisedStaffList;
