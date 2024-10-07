import express from "express";
import cors from "cors";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import connectToDatabase from "./db/db-connect.js";

// Setup our routes.
import routes from "./routes/index.js";
import errorHandler from "./middleware/errorHandler.js";

// Setup Express
const app = express();
const port = process.env.PORT || 3000;

// Setup body-parser
app.options("*", cors()); // include before all routes
app.use(cors());
app.use(express.json());
app.use("/", routes);
app.use(errorHandler);

const __dirname = dirname(fileURLToPath(import.meta.url));
// Make the "public" folder available statically
app.use(express.static(join(__dirname, "../public")));

// Serve up the frontend's "build" directory, if we're running in production mode.
if (process.env.NODE_ENV === "production") {
  // eslint-disable-next-line no-console
  console.log("Running in production!");
}

// Start the DB running. Then, once it's connected, start the server.
connectToDatabase().then(function () {
  // eslint-disable-next-line no-console
  app.listen(port, () => console.log(`App server listening on port ${port}!`));
});
