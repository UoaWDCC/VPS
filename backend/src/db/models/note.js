import mongoose from "mongoose";

const { Schema } = mongoose;

const noteSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  text: {
    type: String,
    required: false,
  },
  date: {
    type: Date,
    required: false,
  },
});

const Note = mongoose.model("Note", noteSchema);

export default Note;
