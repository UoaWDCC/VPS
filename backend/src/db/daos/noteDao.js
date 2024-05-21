import Note from "../models/note";
import Group from "../models/group";

/**
 * Creates a empty note in the database
 * @param {String} groupId group ID the note belongs to
 * @param {String} title  title of the note
 * @param {String} role role of the note
 * @returns
 */
const createNote = async (groupId, title, role) => {
  const dbNote = new Note({ title, role });
  await dbNote.save();
  const updateQuery = {};
  updateQuery[`notes.${role}`] = dbNote.id;
  await Group.updateOne({ id: groupId }, { $push: updateQuery });
  return dbNote;
};

/**
 * Deletes a note from the database
 *  @param {String} noteId note ID
 *  @param {String} groupId group ID
 * @returns
 */
const deleteNote = async (noteId, groupId) => {
  const note = await Note.findById(noteId);
  const updateQuery = {};
  updateQuery[`notes.${note.role}`] = noteId;
  //  delete note from group
  await Group.updateOne({ _id: groupId }, { $pull: updateQuery });
  //  delete note from note collection
  await note.delete();
};

/**
 * updates a note in the database
 * @param {String} noteId note ID
 * @param {{title: String, text: String, role: String}} updatedNote updated note object
 * @returns
 */
const updateNote = async (noteId, updatedNote) => {
  const note = await Note.findById(noteId);

  note.title = updatedNote.title;
  note.text = updatedNote.text;
  note.date = updatedNote.date;
  await note.save();

  return note;
};

/**
 * Retrieves all notes of a  group
 * @param {String} groupId group ID
 * @returns list of database note objects
 */
const retrieveNoteList = async (groupId) => {
  const dbGroup = await Group.findById(groupId);
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
