import { Router } from "express";
import {
  createNote,
  updateNote,
  retrieveNoteList,
  deleteNote,
  retrieveNote,
} from "../../db/daos/noteDao.js";
import auth from "../../middleware/firebaseAuth.js";
import { handle } from "../../util/error.js";
import STATUS from "../../util/status.js";

const router = Router();
const HTTP_OK = 200;

router.use(auth);

// Retrieve note list
router.get("/retrieveAll/:groupId", async (req, res) => {
  const { groupId } = req.params;
  const notes = await retrieveNoteList(groupId);
  res.status(HTTP_OK).json(notes);
});

// Retrieve a note
router.get("/retrieve/:noteId", async (req, res) => {
  const { noteId } = req.params;
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
router.put("/update", async (req, res) => {
  const { noteId, text, title, groupId, email } = req.body;
  const date = new Date();
  await updateNote(noteId, { text, title, date }, groupId, email);
  res.status(HTTP_OK).json("note updated");
});

// Delete a note
router.delete(
  "/delete",
  handle(async (req, res) => {
    const { noteId, groupId, email } = req.body;
    await deleteNote(noteId, groupId, email);
    res.status(STATUS.OK).json("note deleted");
  })
);
export default router;
