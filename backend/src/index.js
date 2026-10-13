import express from "express";
import cors from "cors";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import connectToDatabase from "./db/db-connect.js";

import routes from "./routes/index.js";

import errorHandler from "./middleware/errorHandler.js";

const app = express();
const port = process.env.PORT || 3000;

// CORS + JSON body parsing
app.options("*", cors());
app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.use("/", routes);

// Central error handler (should come after routes)
app.use(errorHandler);

// Static assets
const __dirname = dirname(fileURLToPath(import.meta.url));
app.use(express.static(join(__dirname, "../public")));

// Prod banner
if (process.env.NODE_ENV === "production") {
  console.log("Running in production!");
}

// start connecting at module load, mongoose buffers queries until connected
const dbConnection = connectToDatabase();
dbConnection.catch((err) => console.error("Database connection failed:", err));

// on Vercel the app is imported and invoked as a function, so don't listen
if (!process.env.VERCEL) {
  dbConnection.then(() => {
    app.listen(port, () =>
      console.log(`App server listening on port ${port}!`)
    );
  });
}

export default app;
