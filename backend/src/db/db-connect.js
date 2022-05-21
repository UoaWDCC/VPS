import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const DEFAULT_CONNECTION_STRING = `mongodb://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@cluster0-shard-00-00.ly1k5.mongodb.net:27017,cluster0-shard-00-01.ly1k5.mongodb.net:27017,cluster0-shard-00-02.ly1k5.mongodb.net:27017/?ssl=true&replicaSet=atlas-ahgyms-shard-0&authSource=admin&retryWrites=true&w=majority`;

/**
 * This function begins the process of connecting to the database, and returns a promise that will
 * resolve when the connection is established.
 */
export default function connectToDatabase(
  connectionString = DEFAULT_CONNECTION_STRING
) {
  return mongoose.connect(connectionString, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
}
