import { Router } from "express";
import retrieveAuthorisedStaffList from "../../db/daos/staffDao";

const router = Router();
const HTTP_OK = 200;

// retrieve all authorised staff users
router.get("/", async (req, res) => {
  const staff = await retrieveAuthorisedStaffList();

  res.status(HTTP_OK).json(staff);
});

export default router;
