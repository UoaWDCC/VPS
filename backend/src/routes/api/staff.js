import { Router } from "express";
import retrieveAuthorisedStaffList from "../../db/daos/staffDao";

const router = Router();
const HTTP_OK = 200;

// retrieve all authorised staff users
router.get("/:firebaseID", async (req, res) => { 
  const staff = await retrieveAuthorisedStaffList(req.params.firebaseID);
  const role = staff.length > 0 ? 'staff' : 'user';

  res.status(HTTP_OK).json(role);
});

export default router;
