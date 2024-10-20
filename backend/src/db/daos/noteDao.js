import Note from "../models/note.js";
import Group from "../models/group.js";
import { HttpError } from "../../util/error.js";

/**
 * Checks if a user is in a group
 * @param {String} groupId group ID
 * @param {String} email email of the user
 * @returns role of the user in the group
 * @returns null if user is not in group
 */
const checkRole = async (groupId, email) => {
  const group = await Group.findById(groupId);
  let role = null;
  group.users.forEach((userToCheck) => {
    if (userToCheck.email === email) {
      role = userToCheck.role;
    }
  });
  return role;
};

/**
 * Creates a empty note in the database
 * @param {String} groupId group ID the note belongs to
 * @param {String} title  title of the note
 * @param {String} role role of the note
 * @returns
 */
const createNote = async (groupId, title, email, text = "") => {
  const role = await checkRole(groupId, email);
  if (role === null) {
    return null;
  }
  const dbNote = new Note({ title, role, text });
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
const deleteNote = async (noteId, groupId, email) => {
  const role = await checkRole(groupId, email);
  const note = await Note.findById(noteId, { role: 1 }).lean();
  if (note?.role !== role) throw new HttpError(403, "Forbidden");

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
const updateNote = async (noteId, updatedNote, groupId, email) => {
  const role = await checkRole(groupId, email);
  if (role === null) {
    return;
  }
  const note = await Note.findById(noteId);
  if (note.role !== role) {
    return;
  }
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
//  I know the group is fetched for twice but this is currently not used anywhere
const retrieveNoteList = async (groupId, email) => {
  const dbGroup = await Group.findById(groupId);
  const role = await checkRole(groupId, email);
  //  if user is not in group return null
  if (role === null) {
    return null;
  }
  const allNotes = [];
  const noteIds = [...dbGroup.notes.values()].flat();
  const dbNotes = await Note.find({ _id: { $in: noteIds } }, [
    "title",
    "role",
    "date",
    "text",
  ]);

  allNotes.push(...dbNotes);
  return allNotes;
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
