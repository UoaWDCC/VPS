import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const DEFAULT_CONNECTION_STRING = process.env.MONGODB_URI;

if (!DEFAULT_CONNECTION_STRING) {
  throw new Error(
    "Missing MONGODB_URI. Add it to backend/.env before starting the server."
  );
}

/**
 * This function begins the process of connecting to the database, and returns a promise that will
 * resolve when the connection is established.
 */
export default function connectToDatabase(
  connectionString = DEFAULT_CONNECTION_STRING
) {
  return mongoose.connect(connectionString);
}
