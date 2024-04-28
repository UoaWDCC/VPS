import { Router } from "express";
import {
  createNote,
  updateNote,
  retrieveNoteList,
  deleteNote,
} from "../../db/daos/noteDao";

const router = Router();

const HTTP_OK = 200;

// Retrieve note list
router.post("/retrieveList", async (req, res) => {
  const { groupId } = req.body;
  const notes = retrieveNoteList(groupId);
  res.status(HTTP_OK).json(notes);
  console.log(notes);
});

// Create an empty note
router.post("/", async (req, res) => {
  const { groupId, title, role } = req.body;
  createNote(groupId, title, role);
  res.status(HTTP_OK).json("note created");
});

// Update a note
router.post("/update", async (req, res) => {
  console.log("Note updated");
  const { noteId, text, title } = req.body;
  const date = new Date();
  updateNote(noteId, { text, title, date });
  res.status(HTTP_OK).json("note updated");
});

// Delete a note
router.post("/delete", async (req, res) => {
  const { noteId, groupId } = req.body;
  deleteNote(noteId, groupId);
  res.status(HTTP_OK).json("note deleted");
});
export default router;
