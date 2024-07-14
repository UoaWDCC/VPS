import { Router } from "express";
import {
  createNote,
  updateNote,
  retrieveNoteList,
  deleteNote,
  retrieveNote,
} from "../../db/daos/noteDao";
import auth from "../../middleware/firebaseAuth";

const router = Router();
const HTTP_OK = 200;

router.use(auth);

// Retrieve note list
router.post("/retrieveList", async (req, res) => {
  const { groupId } = req.body;
  const notes = retrieveNoteList(groupId);
  res.status(HTTP_OK).json(notes);
});

// Retrieve a note
router.post("/retrieve", async (req, res) => {
  const { noteId } = req.body;
  const note = await retrieveNote(noteId);
  res.status(HTTP_OK).json(note);
});

// Create an empty note
router.post("/", async (req, res) => {
  const { groupId, title, email } = req.body;
  await createNote(groupId, title, email);
  res.status(HTTP_OK).json("note created");
});

// Update a note
router.post("/update", async (req, res) => {
  const { noteId, text, title } = req.body;
  const date = new Date();
  await updateNote(noteId, { text, title, date });
  res.status(HTTP_OK).json("note updated");
});

// Delete a note
router.post("/delete", async (req, res) => {
  const { noteId, groupId } = req.body;
  await deleteNote(noteId, groupId);
  res.status(HTTP_OK).json("note deleted");
});
export default router;
