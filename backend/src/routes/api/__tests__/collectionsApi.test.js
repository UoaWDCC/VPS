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

import collectionsRouter from "../collections.js";
import CollectionGroup from "../../../db/models/CollectionGroup.js";
import StoredFile from "../../../db/models/StoredFile.js";
import auth from "../../../middleware/firebaseAuth.js";
import errorHandler from "../../../middleware/errorHandler.js";

jest.mock("../../../util/gridfs.js");
jest.mock("../../../middleware/firebaseAuth");
jest.mock("firebase-admin");

import { deleteGridFsById } from "../../../util/gridfs.js";
import { authHeaders } from "./testHelpers.js";
import {
  useMongoMemoryServer,
  useExpressServer,
} from "../../../test/testSetup.js";

auth.mockImplementation(async (req, res, next) => {
  req.body.uid = req.headers.authorization?.split(" ")[1];
  next();
});

deleteGridFsById.mockResolvedValue(undefined);

describe("Collections API tests", () => {
  useMongoMemoryServer();
  const ctx = useExpressServer(() => {
    // collections.js is mounted directly at /api/collections in production
    const app = express();
    app.use(express.json());
    app.use("/api/collections", collectionsRouter);
    app.use(errorHandler);
    return app;
  });

  const scenarioId = new mongoose.mongo.ObjectId("eee000000000000000000001");
  let group;
  let storedFile;
  const fakeGridFsId = new mongoose.mongo.ObjectId("fff000000000000000000001");

  beforeEach(async () => {
    group = await CollectionGroup.create({
      scenarioId,
      name: "Group A",
      order: 1,
    });

    storedFile = await StoredFile.create({
      scenarioId,
      groupId: group._id,
      name: "doc.pdf",
      size: 2048,
      type: "application/pdf",
      gridFsId: fakeGridFsId,
      uploaderUid: "user1",
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // --- POST /api/collections/groups ---

  it("POST /collections/groups creates a new collection group", async () => {
    const response = await axios.post(
      `http://localhost:${ctx.port}/api/collections/groups`,
      { scenarioId: scenarioId.toString(), name: "New Group", order: 2 },
      authHeaders("user1")
    );
    expect(response.status).toBe(201);
    expect(response.data.name).toBe("New Group");
    expect(response.data.scenarioId).toBe(scenarioId.toString());
    expect(response.data.order).toBe(2);

    const dbGroup = await CollectionGroup.findById(response.data._id);
    expect(dbGroup).not.toBeNull();
  });

  it("POST /collections/groups returns 400 when scenarioId is missing", async () => {
    await expect(
      axios.post(
        `http://localhost:${ctx.port}/api/collections/groups`,
        { name: "No Scenario" },
        authHeaders("user1")
      )
    ).rejects.toMatchObject({ response: { status: 400 } });
  });

  it("POST /collections/groups returns 400 when name is missing", async () => {
    await expect(
      axios.post(
        `http://localhost:${ctx.port}/api/collections/groups`,
        { scenarioId: scenarioId.toString() },
        authHeaders("user1")
      )
    ).rejects.toMatchObject({ response: { status: 400 } });
  });

  // --- GET /api/collections/tree/:scenarioId ---

  it("GET /collections/tree/:scenarioId returns groups with their files", async () => {
    const response = await axios.get(
      `http://localhost:${ctx.port}/api/collections/tree/${scenarioId}`,
      authHeaders("user1")
    );
    expect(response.status).toBe(200);
    expect(response.data).toHaveLength(1);

    const returnedGroup = response.data[0];
    expect(returnedGroup.name).toBe("Group A");
    expect(returnedGroup.files).toHaveLength(1);
    expect(returnedGroup.files[0].name).toBe("doc.pdf");
    // gridFsId must never be sent to client
    expect(returnedGroup.files[0].gridFsId).toBeUndefined();
  });

  it("GET /collections/tree/:scenarioId returns empty array for unknown scenario", async () => {
    const otherId = new mongoose.mongo.ObjectId("aaa000000000000000000099");
    const response = await axios.get(
      `http://localhost:${ctx.port}/api/collections/tree/${otherId}`,
      authHeaders("user1")
    );
    expect(response.status).toBe(200);
    expect(response.data).toHaveLength(0);
  });

  it("GET /collections/tree/:scenarioId returns groups sorted by order then name", async () => {
    await CollectionGroup.create({
      scenarioId,
      name: "Alpha Group",
      order: 0,
    });

    const response = await axios.get(
      `http://localhost:${ctx.port}/api/collections/tree/${scenarioId}`,
      authHeaders("user1")
    );
    expect(response.status).toBe(200);
    // order:0 "Alpha Group" should come before order:1 "Group A"
    expect(response.data[0].name).toBe("Alpha Group");
    expect(response.data[1].name).toBe("Group A");
  });

  // --- DELETE /api/collections/groups/:groupId ---

  it("DELETE /collections/groups/:groupId deletes group and all its files", async () => {
    const response = await axios.delete(
      `http://localhost:${ctx.port}/api/collections/groups/${group._id}`,
      authHeaders("user1")
    );
    expect(response.status).toBe(200);
    expect(response.data.deleted.groups).toBe(1);
    expect(response.data.deleted.files).toBe(1);
    expect(deleteGridFsById).toHaveBeenCalledTimes(1);

    const dbGroup = await CollectionGroup.findById(group._id);
    expect(dbGroup).toBeNull();

    const dbFile = await StoredFile.findById(storedFile._id);
    expect(dbFile).toBeNull();
  });

  it("DELETE /collections/groups/:groupId returns 404 when group not found", async () => {
    await expect(
      axios.delete(
        `http://localhost:${ctx.port}/api/collections/groups/000000000000000000000099`,
        authHeaders("user1")
      )
    ).rejects.toMatchObject({ response: { status: 404 } });
  });

  it("DELETE /collections/groups/:groupId with no files reports 0 deleted files", async () => {
    const emptyGroup = await CollectionGroup.create({
      scenarioId,
      name: "Empty Group",
      order: 5,
    });

    const response = await axios.delete(
      `http://localhost:${ctx.port}/api/collections/groups/${emptyGroup._id}`,
      authHeaders("user1")
    );
    expect(response.status).toBe(200);
    expect(response.data.deleted.groups).toBe(1);
    expect(response.data.deleted.files).toBe(0);
    expect(deleteGridFsById).not.toHaveBeenCalled();
  });
});
