import { Router } from "express";
import { createNote } from "../../db/daos/noteDao";

const router = Router();

const HTTP_OK = 200;

router.post("/", async (req, res) => {
  const { groupId, title, role } = req.body;
  createNote(groupId, title, role);
  res.status(HTTP_OK).json("note created");
});

export default router;
