import { Router } from "express";
import {
  createNote,
  updateNote,
  retrieveNoteList,
  deleteNote,
  retrieveNote,
} from "../../db/daos/noteDao.js";
import auth from "../../middleware/firebaseAuth.js";
import { handle, HttpError } from "../../util/error.js";
import STATUS from "../../util/status.js";
import User from "../../db/models/user.js";

const router = Router();
const HTTP_OK = 200;

router.use(auth);

async function getEmailByUid(uid) {
  const user = await User.findOne({ uid }, { email: 1 }).lean();
  if (!user) throw new HttpError("User not found", STATUS.UNAUTHORIZED);
  return user.email;
}

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
router.post(
  "/",
  handle(async (req, res) => {
    const { groupId, title } = req.body;
    const email = await getEmailByUid(req.body.uid);
    await createNote(groupId, title, email);
    res.status(HTTP_OK).json("note created");
  })
);

// Update a note
router.put(
  "/update",
  handle(async (req, res) => {
    const { noteId, text, title, groupId } = req.body;
    const email = await getEmailByUid(req.body.uid);
    const date = new Date();
    await updateNote(noteId, { text, title, date }, groupId, email);
    res.status(HTTP_OK).json("note updated");
  })
);

// Delete a note
router.delete(
  "/delete",
  handle(async (req, res) => {
    const { noteId, groupId } = req.body;
    const email = await getEmailByUid(req.body.uid);
    await deleteNote(noteId, groupId, email);
    res.status(STATUS.OK).json("note deleted");
  })
);

export default router;
