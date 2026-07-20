import {
  jest,
  describe,
  beforeEach,
  afterEach,
  it,
  expect,
} from "@jest/globals";

import express from "express";
import mongoose from "mongoose";
import axios from "axios";
import FormData from "form-data";

import filesRouter from "../files.js";
import StoredFile from "../../../db/models/StoredFile.js";
import CollectionGroup from "../../../db/models/CollectionGroup.js";
import Scenario from "../../../db/models/scenario.js";
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
import {
  useMongoMemoryServer,
  useExpressServer,
} from "../../../test/testSetup.js";

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
  useMongoMemoryServer();
  const ctx = useExpressServer(() => {
    // files.js and collections.js are mounted directly (not through routes/api/index.js)
    const app = express();
    app.use(express.json());
    app.use("/api/files", filesRouter);
    app.use(errorHandler);
    return app;
  });

  let scenarioId;
  let collectionGroup;
  let storedFile;

  beforeEach(async () => {
    const scenario = await Scenario.create({
      name: "Test Scenario",
      uid: "user1",
    });
    scenarioId = scenario._id;

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

  afterEach(() => {
    jest.clearAllMocks();
  });

  // --- Download ---

  it("GET /files/download/:fileId streams a file from GridFS", async () => {
    const response = await axios.get(
      `http://localhost:${ctx.port}/api/files/download/${storedFile._id}`
    );
    expect(response.status).toBe(200);
    expect(streamGridFsToResponse).toHaveBeenCalledTimes(1);
  });

  it("GET /files/download/:fileId returns 404 when file metadata not found", async () => {
    await expect(
      axios.get(
        `http://localhost:${ctx.port}/api/files/download/000000000000000000000099`
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
      `http://localhost:${ctx.port}/api/files/upload`,
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
      axios.post(`http://localhost:${ctx.port}/api/files/upload`, form, {
        headers: { ...form.getHeaders(), Authorization: "Bearer user1" },
      })
    ).rejects.toMatchObject({ response: { status: 400 } });
  });

  it("POST /files/upload returns 400 when no files are sent", async () => {
    const form = new FormData();
    form.append("scenarioId", scenarioId.toString());
    form.append("groupId", collectionGroup._id.toString());

    await expect(
      axios.post(`http://localhost:${ctx.port}/api/files/upload`, form, {
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
      axios.post(`http://localhost:${ctx.port}/api/files/upload`, form, {
        headers: { ...form.getHeaders(), Authorization: "Bearer user1" },
      })
    ).rejects.toMatchObject({ response: { status: 500 } });
  });

  // --- Delete file ---

  it("DELETE /files/:fileId deletes the StoredFile and calls GridFS delete", async () => {
    const response = await axios.delete(
      `http://localhost:${ctx.port}/api/files/${storedFile._id}`,
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
        `http://localhost:${ctx.port}/api/files/000000000000000000000099`,
        authHeaders("user1")
      )
    ).rejects.toMatchObject({ response: { status: 404 } });
  });

  it("DELETE /files/:fileId returns 403 when caller does not own the scenario", async () => {
    await expect(
      axios.delete(
        `http://localhost:${ctx.port}/api/files/${storedFile._id}`,
        authHeaders("stranger")
      )
    ).rejects.toMatchObject({ response: { status: 403 } });
  });

  // --- Rename file ---

  it("PATCH /files/:fileId renames the file", async () => {
    const response = await axios.patch(
      `http://localhost:${ctx.port}/api/files/${storedFile._id}`,
      { name: "renamed.png" },
      authHeaders("user1")
    );
    expect(response.status).toBe(200);
    expect(response.data.name).toBe("renamed.png");
  });

  it("PATCH /files/:fileId returns 400 when name is empty", async () => {
    await expect(
      axios.patch(
        `http://localhost:${ctx.port}/api/files/${storedFile._id}`,
        { name: "  " },
        authHeaders("user1")
      )
    ).rejects.toMatchObject({ response: { status: 400 } });
  });

  it("PATCH /files/:fileId returns 403 when caller does not own the scenario", async () => {
    await expect(
      axios.patch(
        `http://localhost:${ctx.port}/api/files/${storedFile._id}`,
        { name: "renamed.png" },
        authHeaders("stranger")
      )
    ).rejects.toMatchObject({ response: { status: 403 } });
  });

  // --- State conditionals ---

  it("POST /files/state-conditionals/:fileId adds a state conditional", async () => {
    const conditional = {
      stateVariableId: "var-1",
      comparator: "=",
      value: "open",
    };

    const response = await axios.post(
      `http://localhost:${ctx.port}/api/files/state-conditionals/${storedFile._id}`,
      { stateConditional: conditional },
      authHeaders("user1")
    );
    expect(response.status).toBe(200);
    expect(response.data.stateConditionals).toHaveLength(1);
    expect(response.data.stateConditionals[0].stateVariableId).toBe("var-1");
  });

  it("POST /files/state-conditionals/:fileId returns 403 when caller does not own the scenario", async () => {
    await expect(
      axios.post(
        `http://localhost:${ctx.port}/api/files/state-conditionals/${storedFile._id}`,
        {
          stateConditional: {
            stateVariableId: "var-1",
            comparator: "=",
            value: "open",
          },
        },
        authHeaders("stranger")
      )
    ).rejects.toMatchObject({ response: { status: 403 } });
  });

  it("POST /files/state-conditionals/:fileId returns 404 for unknown file", async () => {
    await expect(
      axios.post(
        `http://localhost:${ctx.port}/api/files/state-conditionals/000000000000000000000099`,
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
      `http://localhost:${ctx.port}/api/files/state-conditionals/${storedFile._id}`,
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
      `http://localhost:${ctx.port}/api/files/state-conditionals/${storedFile._id}`,
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
      `http://localhost:${ctx.port}/api/files/state-conditionals/${storedFile._id}`,
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
      `http://localhost:${ctx.port}/api/files/state-conditionals/${storedFile._id}/${conditionalId}`,
      authHeaders("user1")
    );
    expect(response.status).toBe(200);
    expect(response.data.stateConditionals).toHaveLength(0);
  });

  it("DELETE /files/state-conditionals/:fileId/:id returns 404 for non-existent conditional", async () => {
    await expect(
      axios.delete(
        `http://localhost:${ctx.port}/api/files/state-conditionals/${storedFile._id}/000000000000000000000099`,
        authHeaders("user1")
      )
    ).rejects.toMatchObject({ response: { status: 404 } });
  });
});
