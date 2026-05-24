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
import Group from "../../../db/models/group.js";
import Scenario from "../../../db/models/scenario.js";
import Scene from "../../../db/models/scene.js";
import auth from "../../../middleware/firebaseAuth.js";
import { authHeaders } from "./testHelpers.js";

jest.mock("../../../middleware/firebaseAuth");
jest.mock("firebase-admin");

auth.mockImplementation(async (req, res, next) => {
  req.body.uid = req.headers.authorization?.split(" ")[1];
  next();
});

describe("Group API tests", () => {
  let mongoServer;
  let server;
  let port;

  let scenario;
  let scene;
  let group;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    const app = express();
    app.use(express.json());
    app.use("/", routes);

    server = app.listen(0);
    port = server.address().port;
  });

  beforeEach(async () => {
    scene = await Scene.create({ name: "Scene 1", components: [] });

    scenario = await Scenario.create({
      name: "Test Scenario",
      uid: "user1",
      roleList: ["doctor", "nurse"],
      scenes: [scene._id],
    });

    group = await Group.create({
      users: [
        { email: "a@example.com", name: "Alice", role: "doctor", group: "A" },
        { email: "b@example.com", name: "Bob", role: "nurse", group: "A" },
      ],
      notes: {},
      path: [scene._id.toString()],
      scenarioId: scenario._id.toString(),
      currentFlags: [],
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

  it("GET /group/scenario/:scenarioId returns groups for a scenario", async () => {
    const response = await axios.get(
      `http://localhost:${port}/api/group/scenario/${scenario._id}`,
      authHeaders("user1")
    );
    expect(response.status).toBe(200);
    expect(response.data).toHaveLength(1);
    expect(response.data[0]._id).toBe(group._id.toString());
  });

  it("GET /group/scenario/:scenarioId returns empty array for scenario with no groups", async () => {
    const otherScenario = await Scenario.create({
      name: "Other Scenario",
      uid: "user1",
    });

    const response = await axios.get(
      `http://localhost:${port}/api/group/scenario/${otherScenario._id}`,
      authHeaders("user1")
    );
    expect(response.status).toBe(200);
    expect(response.data).toHaveLength(0);
  });

  it("GET /group/path/:groupId returns current scene when path is non-empty", async () => {
    const response = await axios.get(
      `http://localhost:${port}/api/group/path/${group._id}`,
      authHeaders("user1")
    );
    expect(response.status).toBe(200);
    expect(response.data._id).toBe(scene._id.toString());
  });

  it("GET /group/path/:groupId returns null when path is empty", async () => {
    const emptyGroup = await Group.create({
      users: [],
      notes: {},
      path: [],
      scenarioId: scenario._id.toString(),
      currentFlags: [],
    });

    const response = await axios.get(
      `http://localhost:${port}/api/group/path/${emptyGroup._id}`,
      authHeaders("user1")
    );
    expect(response.status).toBe(200);
    expect(response.data).toBeNull();
  });

  it("GET /group/retrieve/:groupId returns a group by id", async () => {
    const response = await axios.get(
      `http://localhost:${port}/api/group/retrieve/${group._id}`,
      authHeaders("user1")
    );
    expect(response.status).toBe(200);
    expect(response.data._id).toBe(group._id.toString());
    expect(response.data.users).toHaveLength(2);
  });

  it("GET /group/retrieve/:groupId returns 404 for unknown group", async () => {
    await expect(
      axios.get(
        `http://localhost:${port}/api/group/retrieve/000000000000000000000099`,
        authHeaders("user1")
      )
    ).rejects.toMatchObject({ response: { status: 404 } });
  });

  it("GET /group/:scenarioId/roleList returns the role list for a scenario", async () => {
    const response = await axios.get(
      `http://localhost:${port}/api/group/${scenario._id}/roleList`,
      authHeaders("user1")
    );
    expect(response.status).toBe(200);
    expect(response.data).toEqual(["doctor", "nurse"]);
  });

  it("POST /group/:scenarioId creates groups for a scenario", async () => {
    const groupList = [
      [
        {
          email: "c@example.com",
          name: "Carol",
          role: "doctor",
          group: "B",
        },
        {
          email: "d@example.com",
          name: "Dan",
          role: "nurse",
          group: "B",
        },
      ],
    ];

    const response = await axios.post(
      `http://localhost:${port}/api/group/${scenario._id}`,
      { groupList, roleList: ["doctor", "nurse"] },
      authHeaders("user1")
    );
    expect(response.status).toBe(200);
    expect(response.data).toHaveLength(1);

    // Previous groups for this scenario should be deleted
    const dbGroups = await Group.find({
      scenarioId: scenario._id.toString(),
    });
    expect(dbGroups).toHaveLength(1);
  });

  it("POST /group/:scenarioId returns 400 when user is missing required fields", async () => {
    const groupList = [
      [
        { email: "x@example.com", name: "X" }, // missing role and group
      ],
    ];

    await expect(
      axios.post(
        `http://localhost:${port}/api/group/${scenario._id}`,
        { groupList, roleList: ["doctor"] },
        authHeaders("user1")
      )
    ).rejects.toMatchObject({ response: { status: 400 } });
  });

  it("POST /group/:scenarioId returns 400 when group does not cover all roles", async () => {
    // roleList has 2 roles but group only has 1 user
    const groupList = [
      [
        {
          email: "e@example.com",
          name: "Eve",
          role: "doctor",
          group: "C",
        },
      ],
    ];

    await expect(
      axios.post(
        `http://localhost:${port}/api/group/${scenario._id}`,
        { groupList, roleList: ["doctor", "nurse"] },
        authHeaders("user1")
      )
    ).rejects.toMatchObject({ response: { status: 400 } });
  });

  it("POST /group/:scenarioId returns 400 when duplicate roles exist within a group", async () => {
    const groupList = [
      [
        {
          email: "f@example.com",
          name: "Frank",
          role: "doctor",
          group: "D",
        },
        {
          email: "g@example.com",
          name: "Grace",
          role: "doctor", // duplicate role
          group: "D",
        },
      ],
    ];

    await expect(
      axios.post(
        `http://localhost:${port}/api/group/${scenario._id}`,
        { groupList, roleList: ["doctor"] },
        authHeaders("user1")
      )
    ).rejects.toMatchObject({ response: { status: 400 } });
  });
});
