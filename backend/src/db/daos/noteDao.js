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
  const dbNote = new Note({ title: title, role: role });
  await dbNote.save();
  const updateQuery = {};
  updateQuery[`notes.${role}`] = dbNote._id;

  await Group.updateOne({ _id: groupId }, { $push: updateQuery });

  return dbNote;
};

const deleteNote = async (noteId) => {
  const note = await Note.findById(noteId);
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
  console.log(note);

  await note.save();

  return note;
};

/**
 * Retrieves one note
 * @param {String} noteId note ID
 * @returns database note object
 */

const retrieveNote = async (noteId) => {
  const dbNote = await Note.findById(noteId);

  return dbNote;
};

/**
 * Retrieves all notes of a given role of a group
 * @param {String} groupId group ID
 * @param {String} role role of the note
 * @returns list of database note objects
 */

const retrieveNoteList = async (groupId, role) => {
  const dbGroup = await Group.findById(groupId);

  const dbNotes = await Note.find({ _id: { $in: dbGroup.notes[role] } }, [
    "title",
    "role",
  ]);

  console.log(dbNotes);

  return dbNotes;
};

export { createNote, updateNote };
