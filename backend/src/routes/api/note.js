import { Router } from "express";
import { createNote, updateNote } from "../../db/daos/noteDao";

const router = Router();

const HTTP_OK = 200;

// Create an empty note
router.post("/", async (req, res) => {
  const { groupId, title, role } = req.body;
  createNote(groupId, title, role);
  res.status(HTTP_OK).json("note created");
});

// Update a note
router.post("/update", async (req, res) => {
  const { noteId, text, title } = req.body;
  const date = new Date();
  updateNote(noteId, { text, title, date });
  res.status(HTTP_OK).json("note updated");
});

export default router;
