import Note from "../models/note.js";
import Group from "../models/group.js";
import { HttpError } from "../../util/error.js";

/**
 * Creates a empty note in the database
 * @param {String} groupId group ID the note belongs to
 * @param {String} title  title of the note
 * @param {String} role role of the note
 * @returns
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
 * Deletes a note from the database
 *  @param {String} noteId note ID
 *  @param {String} groupId group ID
 * @param {String} email email of the user
 * @returns
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
 * updates a note in the database
 * @param {String} noteId note ID
 * @param {{title: String, text: String, role: String}} updatedNote updated note object
 * @param {String} groupId group ID
 * @param {String} email email of the user
 * @returns
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
 * Retrieves all notes of a  group
 * @param {String} groupId group ID
 * @param {String} email email of the user
 * @returns list of database note objects
 */
const retrieveNoteList = async (groupId) => {
  const { notes } = await Group.findById(groupId, { notes: 1 }).lean();
  const noteIds = Object.values(notes).flat();
  const dbNotes = await Note.find({ _id: { $in: noteIds } }, { __v: 0 });
  return dbNotes;
};

/**
 * Retreives a note from the database
 * @param {String} noteId note ID
 * @returns database note object
 */
const retrieveNote = async (noteId) => {
  const note = await Note.findById(noteId);
  return note;
};

export { createNote, updateNote, retrieveNoteList, deleteNote, retrieveNote };
