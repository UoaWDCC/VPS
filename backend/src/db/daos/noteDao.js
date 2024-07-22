import Note from "../models/note";
import Group from "../models/group";

/**
 * Creates a empty note in the database
 * @param {String} groupId group ID the note belongs to
 * @param {String} title  title of the note
 * @param {String} role role of the note
 * @returns
 */
const createNote = async (groupId, title, email, text = "") => {
  const dbGroup = await Group.findById(groupId);
  let role = null;
  dbGroup.users.forEach((userToCheck) => {
    if (userToCheck.email === email) {
      role = userToCheck.role;
    }
  });
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
  const dbGroup = await Group.findById(groupId);
  let role = null;
  dbGroup.users.forEach((userToCheck) => {
    if (userToCheck.email === email) {
      role = userToCheck.role;
    }
  });
  const note = await Note.findById(noteId);
  if (note.role !== role) {
    return null;
  }

  const updateQuery = {
    $pull: { [`notes.${note.role}`]: noteId },
  };

  //  delete note from group
  await Group.updateOne({ _id: groupId }, updateQuery);
  //  delete note from note collection
  await note.delete();
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
  const dbGroup = await Group.findById(groupId);
  let role = null;
  dbGroup.users.forEach((userToCheck) => {
    if (userToCheck.email === email) {
      role = userToCheck.role;
    }
  });
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
const retrieveNoteList = async (groupId, email) => {
  const dbGroup = await Group.findById(groupId);
  let role = null;
  dbGroup.users.forEach((userToCheck) => {
    if (userToCheck.email === email) {
      role = userToCheck.role;
    }
  });
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
