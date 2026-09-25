import Note from "../models/note.js";
import Group from "../models/group.js";
import { HttpError } from "../../util/error.js";

/**
 * Checks whether a note exists in the provided group.
 *
 * @param {object} group - Group document containing the note references.
 * @param {string} noteId - The ID of the note to check.
 * @returns {boolean} True when the note is present in the group, otherwise false.
 */
export const hasNoteInGroup = (group, noteId) => {
  if (!group?.notes) return false;

  const groupedNotes =
    group.notes instanceof Map
      ? Array.from(group.notes.values())
      : Object.values(group.notes);

  return groupedNotes.flat().some((id) => id === noteId);
};

/**
 * Creates an empty note and attaches it to the group.
 *
 * @param {string} groupId - The ID of the group that owns the note.
 * @param {string} title - The title of the new note.
 * @param {string} role - The membership role used to store the note reference.
 * @param {string} [text=""] - Initial note text.
 * @returns {Promise<object>} The saved note document.
 */
const createNote = async (groupId, title, role, text = "") => {
  const dbNote = new Note({ title, role, text, date: new Date() });
  await dbNote.save();
  const updateQuery = {};
  updateQuery[`notes.${role}`] = dbNote.id;
  await Group.updateOne({ _id: groupId }, { $push: updateQuery });
  return dbNote;
};

/**
 * Deletes a note from the database and removes its reference from the group.
 *
 * @param {string} noteId - The note ID to delete.
 * @param {string} groupId - The ID of the group containing the note.
 * @param {string} role - The role required to authorize the deletion.
 * @returns {Promise<null>} Resolves when the note has been removed.
 */
const deleteNote = async (noteId, groupId, role) => {
  const note = await Note.findById(noteId, { role: 1 }).lean();
  if (note?.role !== role) throw new HttpError("forbidden", 403);

  const updateQuery = { $pull: { [`notes.${note.role}`]: noteId } };
  await Promise.all([
    // remove reference
    Group.updateOne({ _id: groupId }, updateQuery),
    // remove document
    Note.deleteOne({ _id: noteId }),
  ]);

  return null;
};

/**
 * Updates a note in the database.
 *
 * @param {string} noteId - The note ID to update.
 * @param {{ title: string, text: string, date: Date }} updatedNote - Updated note content.
 * @param {string} role - The role required to authorize the update.
 * @returns {Promise<void>} Resolves when the note has been saved.
 */
const updateNote = async (noteId, updatedNote, role) => {
  const note = await Note.findById(noteId);
  if (note?.role !== role) throw new HttpError("forbidden", 403);
  note.title = updatedNote.title;
  note.text = updatedNote.text;
  note.date = updatedNote.date;
  await note.save();
};

/**
 * Retrieves all notes belonging to a group.
 *
 * @param {string} groupId - The group ID to look up.
 * @returns {Promise<Array<object>>} A list of note documents for the group.
 */
const retrieveNoteList = async (groupId) => {
  const { notes } = await Group.findById(groupId, { notes: 1 }).lean();
  const noteIds = Object.values(notes).flat();
  const dbNotes = await Note.find({ _id: { $in: noteIds } }, { __v: 0 });
  return dbNotes;
};

/**
 * Retrieves a single note by ID.
 *
 * @param {string} noteId - The note ID to look up.
 * @returns {Promise<object|null>} The note document, if found.
 */
const retrieveNote = async (noteId) => {
  const note = await Note.findOne({ _id: noteId });
  return note;
};

export { createNote, updateNote, retrieveNoteList, deleteNote, retrieveNote };
