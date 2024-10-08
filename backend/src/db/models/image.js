import mongoose from "mongoose";

const { Schema } = mongoose;

const imageSchema = new Schema({
  url: {
    type: String,
    required: true,
    unique: true,
  },
});

imageSchema.path("url").validate((val) => {
  const urlRegex =
    /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-/]))?/;
  return urlRegex.test(val);
}, "Invalid URL.");

const Image = mongoose.model("Image", imageSchema);

export default Image;
