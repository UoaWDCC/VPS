import express from "express";
import cors from "cors";
import { join } from "path";
import connectToDatabase from "./db/db-connect";

// Setup Express
const app = express();
const port = process.env.PORT || 3000;

// Setup body-parser
app.use(express.json());
app.use(cors());

// Setup our routes.
import routes from "./routes";
app.use("/", routes);

// Make the "public" folder available statically
app.use(express.static(join(__dirname, "../public")));

// Serve up the frontend's "build" directory, if we're running in production mode.
if (process.env.NODE_ENV === "production") {
  console.log("Running in production!");

  // Make all files in that folder public
  app.use(express.static(express.join(__dirname, "../../frontend/build")));

  // If we get any GET request we can't process using one of the server routes, serve up index.html by default.
  app.get("*", function (req, res) {
    res.sendFile(express.join(__dirname, "../../frontend/build/index.html"));
  });
}

// Start the DB running. Then, once it's connected, start the server.
connectToDatabase().then(function () {
  app.listen(port, () => console.log(`App server listening on port ${port}!`));
});
