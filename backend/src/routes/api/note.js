import { Router } from "express";
import {
  createNote,
  updateNote,
  retrieveNoteList,
  deleteNote,
  retrieveNote,
} from "../../db/daos/noteDao.js";
import firebaseAuth from "../../middleware/firebaseAuth.js";
import groupAuth from "../../middleware/groupAuth.js";
import { handle } from "../../util/error.js";

const router = Router({ mergeParams: true });

router.use(firebaseAuth);
router.use(groupAuth);

// Retrieve note list
router.get("/", async (req, res) => {
  const { groupId } = req.params;
  const notes = await retrieveNoteList(groupId);
  res.json(notes);
});

// Retrieve a note
router.get("/:noteId", async (req, res) => {
  const { noteId } = req.params;
  const note = await retrieveNote(noteId);
  res.json(note);
});

// Create an empty note
router.post(
  "/",
  handle(async (req, res) => {
    const { title, membership } = req.body;
    const { groupId } = req.params;
    await createNote(groupId, title, membership.role);
    res.json("note created");
  })
);

// Update a note
router.put(
  "/:noteId",
  handle(async (req, res) => {
    const { noteId } = req.params;
    const { membership, text, title } = req.body;
    await updateNote(
      noteId,
      { text, title, date: new Date() },
      membership.role
    );
    res.json("note updated");
  })
);

// Delete a note
router.delete(
  "/:noteId",
  handle(async (req, res) => {
    const { noteId, groupId } = req.params;
    const { membership } = req.body;
    await deleteNote(noteId, groupId, membership.role);
    res.json("note deleted");
  })
);

export default router;
