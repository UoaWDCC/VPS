import { Router } from "express";
import {
  createNote,
  updateNote,
  retrieveNoteList,
  deleteNote,
  retrieveNote,
  hasNoteInGroup,
} from "../../db/daos/noteDao.js";
import firebaseAuth from "../../middleware/firebaseAuth.js";
import groupAuth from "../../middleware/groupAuth.js";
import { handle, HttpError } from "../../util/error.js";
import { HttpStatusCode } from "axios";

const router = Router({ mergeParams: true });

router.use(firebaseAuth);
router.use(groupAuth);

// Retrieve note list
router.get(
  "/",
  handle(async (req, res) => {
    const { groupId } = req.params;
    const notes = await retrieveNoteList(groupId);
    res.json(notes);
  })
);

// Retrieve a note
router.get(
  "/:noteId",
  handle(async (req, res) => {
    const { noteId } = req.params;
    if (!hasNoteInGroup(req.body.group, noteId))
      throw new HttpError("note not found", HttpStatusCode.NotFound);
    const note = await retrieveNote(noteId);
    res.json(note);
  })
);

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
    const { membership, group, text, title } = req.body;
    if (!hasNoteInGroup(group, noteId))
      throw new HttpError("note not found", HttpStatusCode.NotFound);
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
    const { membership, group } = req.body;
    if (!hasNoteInGroup(group, noteId))
      throw new HttpError("note not found", HttpStatusCode.NotFound);
    await deleteNote(noteId, groupId, membership.role);
    res.json("note deleted");
  })
);

export default router;
