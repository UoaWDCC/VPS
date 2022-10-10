import mongoose from "mongoose";

const { Schema } = mongoose;

const staffSchema = new Schema({
  firebaseID: {
    type: String,
    required: true,
    unique: true,
  },
  emailAddress: {
    type: String,
    required: true,
    unique: true,
  },
});

const Staff = mongoose.model("Staff", staffSchema);

export default Staff;
