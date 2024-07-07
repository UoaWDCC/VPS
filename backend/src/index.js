import express from "express";
import cors from "cors";
import { join } from "path";
import connectToDatabase from "./db/db-connect";

// Setup our routes.
import routes from "./routes";
import errorHandler from "./middleware/errorHandler";

// Setup Express
const app = express();
const port = process.env.PORT || 3000;

// Setup body-parser
app.options("*", cors()); // include before all routes
app.use(cors());
app.use(express.json());
app.use("/", routes);
app.use(errorHandler);

// Make the "public" folder available statically
app.use(express.static(join(__dirname, "../public")));

// Serve up the frontend's "build" directory, if we're running in production mode.
if (process.env.NODE_ENV === "production") {
  // eslint-disable-next-line no-console
  console.log("Running in production!");
}

// Start the DB running. Then, once it's connected, start the server.
connectToDatabase().then(function () {
  // eslint-disable-next-line no-console
  app.listen(port, () => console.log(`App server listening on port ${port}!`));
});
