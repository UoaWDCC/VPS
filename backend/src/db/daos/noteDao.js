import Note from "../models/note";
import Group from "../models/group";

const createNote = async (groupId, title, role) => {
  const dbNote = new Note({ title: title });
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

export { createNote };
