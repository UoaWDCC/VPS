import Note from "../models/note";
import Group from "../models/group";

const createNote = async (groupId, title, role) => {
  const dbNote = new Note(title);
  await dbNote.save();

  const updateQuery = {};
  updateQuery[`notes.${role}`] = dbNote._id;

  await Group.updateOne({ _id: groupId }, { $push: updateQuery });

  return dbNote;
};

export { createNote };
