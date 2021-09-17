/* eslint-disable no-underscore-dangle */
import { MongoMemoryServer } from "mongodb-memory-server";
import express from "express";
import mongoose from "mongoose";
import axios from "axios";
import routes from "../..";
import Image from "../../../db/models/image";

describe("Image API tests", () => {
  const HTTP_OK = 200;

  let mongoServer;
  let server;
  let port;

  // setup in-memory mongodb and express API
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();

    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const app = express();
    app.use(express.json());
    app.use("/", routes);

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
      urls: [
        "https://drive.google.com/uc?export=view&id=1IExv9SGZq_KFFGOxBzhz_OfO6UAWLL5z",
        "https://drive.google.com/uc?export=view&id=1uRyrBAvCZf2dPHXR0TjsPVncU_rz0vuZ",
      ],
    };
    const response = await axios.post(
      `http://localhost:${port}/api/image/`,
      body
    );
    expect(response.status).toBe(HTTP_OK);

    // check if scenario has been persisted to db
    const dbImages = await Image.find();

    expect(dbImages).toHaveLength(2);
    expect(dbImages[0].url).toEqual(body.urls[0]);
    expect(dbImages[1].url).toEqual(body.urls[1]);
  });

  it("GET/image: retrieves all images in the database", async () => {
    const urls = [
      "https://drive.google.com/uc?export=view&id=1IExv9SGZq_KFFGOxBzhz_OfO6UAWLL5z",
      "https://drive.google.com/uc?export=view&id=1uRyrBAvCZf2dPHXR0TjsPVncU_rz0vuZ",
    ];
    urls.forEach((url) => {
      const dbImage = new Image({
        url,
      });
      dbImage.save();
    });

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
      _id: new mongoose.mongo.ObjectId("000000000000000000000001"),
      url: "https://drive.google.com/uc?export=view&id=1IExv9SGZq_KFFGOxBzhz_OfO6UAWLL5z",
    };

    const image2 = {
      _id: new mongoose.mongo.ObjectId("000000000000000000000002"),
      url: "https://drive.google.com/uc?export=view&id=1uRyrBAvCZf2dPHXR0TjsPVncU_rz0vuZ",
    };

    await Image.create([image1, image2]);

    const response = await axios.get(
      `http://localhost:${port}/api/image/${image2._id}`
    );
    expect(response.status).toBe(HTTP_OK);

    // check correct image is returned
    const image = response.data;
    expect(image.url).toEqual(image2.url);
  });
});
