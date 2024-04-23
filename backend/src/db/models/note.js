import mongoose from "mongoose";

const { Schema } = mongoose;

const noteSchema = new Schema({
  text: {
    type: String,
    required: false,
  },
});

const Note = mongoose.model("Note", noteSchema);

export default Note;
