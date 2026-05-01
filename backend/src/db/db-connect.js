import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const DEFAULT_CONNECTION_STRING = `mongodb://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@primary-shard-00-00.rjlaw.mongodb.net:27017,primary-shard-00-01.rjlaw.mongodb.net:27017,primary-shard-00-02.rjlaw.mongodb.net:27017/?ssl=true&replicaSet=atlas-13rul7-shard-0&authSource=admin&appName=Primary`;

/**
 * This function begins the process of connecting to the database, and returns a promise that will
 * resolve when the connection is established.
 */
export default function connectToDatabase(
  connectionString = DEFAULT_CONNECTION_STRING
) {
  return mongoose.connect(connectionString);
}
1;
