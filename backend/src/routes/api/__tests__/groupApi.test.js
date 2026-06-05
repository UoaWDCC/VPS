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
import routes from "../../index.js";
import Scenario from "../../../db/models/scenario.js";
import Group from "../../../db/models/group.js";

jest.mock("firebase-admin");

describe("Group API tests", () => {
  const HTTP_OK = 200;
  const HTTP_BAD_REQUEST = 400;

  let mongoServer;
  let server;
  let port;

  const scenarioId = new mongoose.mongo.ObjectId("000000000000000000000001");

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();

    await mongoose.connect(uri);

    const app = express();
    app.use(express.json());
    app.use("/", routes);

    server = app.listen(0);
    port = server.address().port;
  });

  beforeEach(async () => {
    await Scenario.create({
      _id: scenarioId,
      name: "Scenario 1",
      uid: "user1",
      roleList: ["doctor"],
    });

    await Group.create({
      scenarioId: scenarioId.toString(),
      users: [
        {
          email: "alex@example.com",
          name: "Alex",
          role: "Doctor",
          group: "1",
        },
      ],
      notes: new Map(),
      path: ["scene-a"],
    });
  });

  afterEach(async () => {
    await mongoose.connection.db.dropDatabase();
  });

  afterAll(async () => {
    server.close(async () => {
      await mongoose.disconnect();
      await mongoServer.stop();
    });
  });

  it("adds a member to an existing group without recreating the group", async () => {
    const originalGroup = await Group.findOne({ scenarioId }).lean();

    const response = await axios.post(
      `http://localhost:${port}/api/group/${scenarioId}/member`,
      {
        email: "sam@example.com",
        name: "Sam",
        role: "Nurse",
        group: "1",
      }
    );

    expect(response.status).toBe(HTTP_OK);

    const group = await Group.findById(originalGroup._id).lean();
    expect(group.users).toHaveLength(2);
    expect(group.path).toEqual(["scene-a"]);
    expect(group.users[1]).toMatchObject({
      email: "sam@example.com",
      name: "Sam",
      role: "Nurse",
      group: "1",
    });

    const scenario = await Scenario.findById(scenarioId).lean();
    expect(scenario.roleList).toEqual(["doctor", "nurse"]);
  });

  it("creates the group when the selected group number does not exist", async () => {
    const response = await axios.post(
      `http://localhost:${port}/api/group/${scenarioId}/member`,
      {
        email: "casey@example.com",
        name: "Casey",
        role: "Observer",
        group: "2",
      }
    );

    expect(response.status).toBe(HTTP_OK);

    const groups = await Group.find({ scenarioId }).sort({ _id: 1 }).lean();
    expect(groups).toHaveLength(2);
    expect(groups[1].users).toEqual([
      expect.objectContaining({
        email: "casey@example.com",
        name: "Casey",
        role: "Observer",
        group: "2",
      }),
    ]);
  });

  it("rejects duplicate emails in the scenario", async () => {
    await expect(
      axios.post(`http://localhost:${port}/api/group/${scenarioId}/member`, {
        email: "alex@example.com",
        name: "Alex 2",
        role: "Nurse",
        group: "1",
      })
    ).rejects.toMatchObject({
      response: {
        status: HTTP_BAD_REQUEST,
      },
    });
  });

  it("rejects duplicate roles in the same group", async () => {
    await expect(
      axios.post(`http://localhost:${port}/api/group/${scenarioId}/member`, {
        email: "sam@example.com",
        name: "Sam",
        role: "doctor",
        group: "1",
      })
    ).rejects.toMatchObject({
      response: {
        status: HTTP_BAD_REQUEST,
      },
    });
  });
});
