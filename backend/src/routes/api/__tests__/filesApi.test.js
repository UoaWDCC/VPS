import {
  jest,
  describe,
  beforeAll,
  beforeEach,
  afterEach,
  afterAll,
  it,
  expect,
} from "@jest/globals";

import { MongoMemoryServer } from "mongodb-memory-server";
import express from "express";
import mongoose from "mongoose";
import axios from "axios";
import FormData from "form-data";

import filesRouter from "../files.js";
import StoredFile from "../../../db/models/StoredFile.js";
import CollectionGroup from "../../../db/models/CollectionGroup.js";
import auth from "../../../middleware/firebaseAuth.js";
import errorHandler from "../../../middleware/errorHandler.js";

jest.mock("../../../util/gridfs.js");
jest.mock("../../../middleware/firebaseAuth");
jest.mock("firebase-admin");

import {
  uploadBufferToGridFS,
  streamGridFsToResponse,
  deleteGridFsById,
} from "../../../util/gridfs.js";
import { authHeaders } from "./testHelpers.js";

auth.mockImplementation(async (req, res, next) => {
  req.body.uid = req.headers.authorization?.split(" ")[1];
  next();
});

const fakeGridFsId = new mongoose.mongo.ObjectId("aaa000000000000000000001");

uploadBufferToGridFS.mockResolvedValue(fakeGridFsId);
streamGridFsToResponse.mockImplementation(({ res }) => {
  res.setHeader("Content-Type", "image/png");
  res.status(200).send("fake-file-data");
});
deleteGridFsById.mockResolvedValue(undefined);

describe("Files API tests", () => {
  let mongoServer;
  let server;
  let port;

  const scenarioId = new mongoose.mongo.ObjectId("ccc000000000000000000001");
  let collectionGroup;
  let storedFile;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    // files.js and collections.js are mounted directly (not through routes/api/index.js)
    const app = express();
    app.use(express.json());
    app.use("/api/files", filesRouter);
    app.use(errorHandler);

    server = app.listen(0);
    port = server.address().port;
  });

  beforeEach(async () => {
    collectionGroup = await CollectionGroup.create({
      scenarioId,
      name: "Test Group",
      order: 0,
    });

    storedFile = await StoredFile.create({
      scenarioId,
      groupId: collectionGroup._id,
      name: "test.png",
      size: 1024,
      type: "image/png",
      gridFsId: fakeGridFsId,
      uploaderUid: "user1",
    });
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await mongoose.connection.db.dropDatabase();
  });

  afterAll(async () => {
    server.close(async () => {
      await mongoose.disconnect();
      await mongoServer.stop();
    });
  });

  // --- Download ---

  it("GET /files/download/:fileId streams a file from GridFS", async () => {
    const response = await axios.get(
      `http://localhost:${port}/api/files/download/${storedFile._id}`
    );
    expect(response.status).toBe(200);
    expect(streamGridFsToResponse).toHaveBeenCalledTimes(1);
  });

  it("GET /files/download/:fileId returns 404 when file metadata not found", async () => {
    await expect(
      axios.get(
        `http://localhost:${port}/api/files/download/000000000000000000000099`
      )
    ).rejects.toMatchObject({ response: { status: 404 } });
  });

  // --- Upload ---

  it("POST /files/upload uploads files and creates StoredFile documents", async () => {
    const form = new FormData();
    form.append("scenarioId", scenarioId.toString());
    form.append("groupId", collectionGroup._id.toString());
    form.append("files", Buffer.from("fake-image-data"), {
      filename: "upload.png",
      contentType: "image/png",
    });

    const response = await axios.post(
      `http://localhost:${port}/api/files/upload`,
      form,
      {
        headers: {
          ...form.getHeaders(),
          Authorization: "Bearer user1",
        },
      }
    );
    expect(response.status).toBe(201);
    expect(response.data.files).toHaveLength(1);
    expect(response.data.files[0].name).toBe("upload.png");
    // gridFsId must not be exposed to the client
    expect(response.data.files[0].gridFsId).toBeUndefined();
    expect(uploadBufferToGridFS).toHaveBeenCalledTimes(1);
  });

  it("POST /files/upload returns 400 when scenarioId or groupId is missing", async () => {
    const form = new FormData();
    form.append("files", Buffer.from("data"), {
      filename: "x.png",
      contentType: "image/png",
    });

    await expect(
      axios.post(`http://localhost:${port}/api/files/upload`, form, {
        headers: { ...form.getHeaders(), Authorization: "Bearer user1" },
      })
    ).rejects.toMatchObject({ response: { status: 400 } });
  });

  it("POST /files/upload returns 400 when no files are sent", async () => {
    const form = new FormData();
    form.append("scenarioId", scenarioId.toString());
    form.append("groupId", collectionGroup._id.toString());

    await expect(
      axios.post(`http://localhost:${port}/api/files/upload`, form, {
        headers: { ...form.getHeaders(), Authorization: "Bearer user1" },
      })
    ).rejects.toMatchObject({ response: { status: 400 } });
  });

  it("POST /files/upload returns 500 when groupId does not belong to scenarioId", async () => {
    const otherScenarioId = new mongoose.mongo.ObjectId(
      "ddd000000000000000000001"
    );
    const form = new FormData();
    form.append("scenarioId", otherScenarioId.toString());
    form.append("groupId", collectionGroup._id.toString());
    form.append("files", Buffer.from("data"), {
      filename: "x.png",
      contentType: "image/png",
    });

    await expect(
      axios.post(`http://localhost:${port}/api/files/upload`, form, {
        headers: { ...form.getHeaders(), Authorization: "Bearer user1" },
      })
    ).rejects.toMatchObject({ response: { status: 500 } });
  });

  // --- Delete file ---

  it("DELETE /files/:fileId deletes the StoredFile and calls GridFS delete", async () => {
    const response = await axios.delete(
      `http://localhost:${port}/api/files/${storedFile._id}`,
      authHeaders("user1")
    );
    expect(response.status).toBe(200);
    expect(response.data.deleted).toBe(1);
    expect(deleteGridFsById).toHaveBeenCalledTimes(1);

    const dbFile = await StoredFile.findById(storedFile._id);
    expect(dbFile).toBeNull();
  });

  it("DELETE /files/:fileId returns 404 when file not found", async () => {
    await expect(
      axios.delete(
        `http://localhost:${port}/api/files/000000000000000000000099`,
        authHeaders("user1")
      )
    ).rejects.toMatchObject({ response: { status: 404 } });
  });

  // --- State conditionals ---

  it("POST /files/state-conditionals/:fileId adds a state conditional", async () => {
    const conditional = {
      stateVariableId: "var-1",
      comparator: "=",
      value: "open",
    };

    const response = await axios.post(
      `http://localhost:${port}/api/files/state-conditionals/${storedFile._id}`,
      { stateConditional: conditional },
      authHeaders("user1")
    );
    expect(response.status).toBe(200);
    expect(response.data.stateConditionals).toHaveLength(1);
    expect(response.data.stateConditionals[0].stateVariableId).toBe("var-1");
  });

  it("POST /files/state-conditionals/:fileId returns 404 for unknown file", async () => {
    await expect(
      axios.post(
        `http://localhost:${port}/api/files/state-conditionals/000000000000000000000099`,
        {
          stateConditional: { stateVariableId: "x", comparator: "=", value: 1 },
        },
        authHeaders("user1")
      )
    ).rejects.toMatchObject({ response: { status: 404 } });
  });

  it("PUT /files/state-conditionals/:fileId updates an existing state conditional", async () => {
    // First add a conditional
    const addResp = await axios.post(
      `http://localhost:${port}/api/files/state-conditionals/${storedFile._id}`,
      {
        stateConditional: {
          stateVariableId: "var-1",
          comparator: "=",
          value: "old",
        },
      },
      authHeaders("user1")
    );
    const addedId = addResp.data.stateConditionals[0]._id;

    const response = await axios.put(
      `http://localhost:${port}/api/files/state-conditionals/${storedFile._id}`,
      {
        stateConditional: {
          _id: addedId,
          stateVariableId: "var-1",
          comparator: "!=",
          value: "new",
        },
      },
      authHeaders("user1")
    );
    expect(response.status).toBe(200);
    expect(response.data.stateConditionals[0].comparator).toBe("!=");
    expect(response.data.stateConditionals[0].value).toBe("new");
  });

  it("DELETE /files/state-conditionals/:fileId/:stateConditionalId removes a conditional", async () => {
    // Add a conditional first
    const addResp = await axios.post(
      `http://localhost:${port}/api/files/state-conditionals/${storedFile._id}`,
      {
        stateConditional: {
          stateVariableId: "var-1",
          comparator: "=",
          value: "x",
        },
      },
      authHeaders("user1")
    );
    const conditionalId = addResp.data.stateConditionals[0]._id;

    const response = await axios.delete(
      `http://localhost:${port}/api/files/state-conditionals/${storedFile._id}/${conditionalId}`,
      authHeaders("user1")
    );
    expect(response.status).toBe(200);
    expect(response.data.stateConditionals).toHaveLength(0);
  });

  it("DELETE /files/state-conditionals/:fileId/:id returns 404 for non-existent conditional", async () => {
    await expect(
      axios.delete(
        `http://localhost:${port}/api/files/state-conditionals/${storedFile._id}/000000000000000000000099`,
        authHeaders("user1")
      )
    ).rejects.toMatchObject({ response: { status: 404 } });
  });
});
