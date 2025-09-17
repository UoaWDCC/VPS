import express from "express";
import cors from "cors";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import connectToDatabase from "./db/db-connect.js";

import routes from "./routes/index.js";
import collectionsRouter from "./routes/api/collections.js";
import filesRouter from "./routes/api/files.js";

import errorHandler from "./middleware/errorHandler.js";

const app = express();
const port = process.env.PORT || 3000;

// CORS + JSON body parsing
app.options("*", cors());
app.use(cors());
app.use(express.json({ limit: "2mb" })); // JSON for non-multipart routes

// Mount new API routes (GridFS-backed)
app.use("/api/collections", collectionsRouter);
app.use("/api/files", filesRouter);

// Keep your existing routes as-is (e.g., /api/resources CSV upload, etc.)
app.use("/", routes);

// Central error handler (should come after routes)
app.use(errorHandler);

// Static assets
const __dirname = dirname(fileURLToPath(import.meta.url));
app.use(express.static(join(__dirname, "../public")));

// Prod banner (you can also serve your frontend build here if needed)
if (process.env.NODE_ENV === "production") {
  console.log("Running in production!");
}

// Connect DB first, then start server.
// NOTE: GridFS helpers use the active Mongoose connection from db-connect.js.
connectToDatabase().then(() => {
  app.listen(port, () => console.log(`App server listening on port ${port}!`));
});
