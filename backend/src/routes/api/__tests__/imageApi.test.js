import {
  jest,
  describe,
  beforeAll,
  afterEach,
  afterAll,
  it,
  expect,
} from "@jest/globals";

import { MongoMemoryServer } from "mongodb-memory-server";
import express from "express";
import mongoose from "mongoose";
import axios from "axios";
import routes from "../../index.js";
import Image from "../../../db/models/image.js";

jest.mock("firebase-admin"); // Needed to mock the firebase-admin dependency in firebase-auth.js which is in routes

describe("Image API tests", () => {
  const HTTP_OK = 200;

  let mongoServer;
  let server;
  let port;

  // setup in-memory mongodb and express API
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();

    await mongoose.connect(uri);

    const app = express();
    app.use(express.json());
    app.use("/", routes);

    // Add safe error handler to avoid circular JSON errors
    app.use((err, res) => {
      console.error("Unhandled Express error:", err.message);
      res.status(500).json({ error: "Internal Server Error" });
    });

    server = app.listen(0);
    port = server.address().port;
  });

  // clear the database
  afterEach(async () => {
    await mongoose.connection.db.dropDatabase();
  });

  // close the mongodb and express servers
  afterAll(async () => {
    server.close(async () => {
      await mongoose.disconnect();
      await mongoServer.stop();
    });
  });

  it("creates images in the database", async () => {
    const body = {
      images: [
        {
          id: "img1",
          url: "https://example.com/image1.jpg",
          fileName: "image1.jpg",
          uploadedAt: new Date().toISOString(),
        },
        {
          id: "img2",
          url: "https://example.com/image2.jpg",
          fileName: "image2.jpg",
          uploadedAt: new Date().toISOString(),
        },
      ],
    };

    const response = await axios.post(
      `http://localhost:${port}/api/image/`,
      body
    );
    expect(response.status).toBe(HTTP_OK);

    // check if scenario has been persisted to db
    const dbImages = await Image.find().sort({ url: 1 });

    expect(dbImages).toHaveLength(2);
    expect(dbImages[0].url).toEqual(body.images[0].url);
    expect(dbImages[1].url).toEqual(body.images[1].url);
  });

  it("GET/image: retrieves all images in the database", async () => {
    const urls = [
      "https://drive.google.com/uc?export=view&id=1IExv9SGZq_KFFGOxBzhz_OfO6UAWLL5z",
      "https://drive.google.com/uc?export=view&id=1uRyrBAvCZf2dPHXR0TjsPVncU_rz0vuZ",
    ];

    await Promise.all(urls.map((url) => new Image({ url }).save()));

    const response = await axios.get(`http://localhost:${port}/api/image/`);
    expect(response.status).toBe(HTTP_OK);

    // check correct images are returned
    const images = response.data;
    expect(images).toHaveLength(2);

    expect(images[0].url).toEqual(urls[0]);
    expect(images[1].url).toEqual(urls[1]);
  });

  it("GET/image: retrieves a specific image in the database", async () => {
    const image1 = {
      id: "img1",
      url: "https://example.com/image1.jpg",
    };

    const image2 = {
      id: "img2",
      url: "https://example.com/image2.jpg",
    };

    await Image.create([image1, image2]);

    const response = await axios.get(
      `http://localhost:${port}/api/image/${image2.id}`
    );
    expect(response.status).toBe(HTTP_OK);

    // check correct image is returned
    const image = response.data;
    expect(image.url).toEqual(image2.url);
  });
});
