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
import Scene from "../../../db/models/scene.js";
import Group from "../../../db/models/group.js";
import Access from "../../../db/models/access.js";
import auth from "../../../middleware/firebaseAuth.js";
import dashboardAuth from "../../../middleware/dashboardAuth.js";
import { authHeaders } from "./testHelpers.js";

jest.mock("../../../middleware/firebaseAuth");
jest.mock("../../../middleware/dashboardAuth");
jest.mock("firebase-admin");

auth.mockImplementation(async (req, res, next) => {
  req.body.uid = req.headers.authorization?.split(" ")[1];
  next();
});

dashboardAuth.mockImplementation(async (req, res, next) => {
  next();
});

describe("Dashboard API tests", () => {
  let mongoServer;
  let server;
  let port;

  let scenario;
  let scene1;
  let scene2;
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
    scene1 = await Scene.create({ name: "Scene 1", components: [] });
    scene2 = await Scene.create({ name: "Scene 2", components: [] });

    scenario = await Scenario.create({
      name: "Dashboard Scenario",
      uid: "user1",
      scenes: [scene1._id, scene2._id],
    });

    group = await Group.create({
      users: [{ email: "p@example.com", name: "Player", role: "doctor" }],
      notes: {},
      path: [],
      scenarioId: scenario._id.toString(),
      currentFlags: [],
    });

    await Access.create({
      scenarioId: scenario._id.toString(),
      name: scenario.name,
      ownerId: "user1",
      users: { user1: { name: "Owner", email: "owner@example.com" } },
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

  it("GET /dashboard/ returns ok:true health check", async () => {
    const response = await axios.get(
      `http://localhost:${port}/api/dashboard/`,
      authHeaders("user1")
    );
    expect(response.status).toBe(200);
    expect(response.data).toEqual({ ok: true });
  });

  it("GET /dashboard/scenarios/:scenarioId/access returns allowed:true", async () => {
    const response = await axios.get(
      `http://localhost:${port}/api/dashboard/scenarios/${scenario._id}/access`,
      authHeaders("user1")
    );
    expect(response.status).toBe(200);
    expect(response.data).toEqual({ allowed: true });
  });

  it("GET /dashboard/scenarios/:scenarioId returns the scenario", async () => {
    const response = await axios.get(
      `http://localhost:${port}/api/dashboard/scenarios/${scenario._id}`,
      authHeaders("user1")
    );
    expect(response.status).toBe(200);
    expect(response.data._id).toBe(scenario._id.toString());
    expect(response.data.name).toBe("Dashboard Scenario");
  });

  it("GET /dashboard/scenarios/:scenarioId returns 200 with null for unknown id", async () => {
    // retrieveScenario returns null (no throw) when not found,
    // so the route responds 200 with null body.
    const response = await axios.get(
      `http://localhost:${port}/api/dashboard/scenarios/000000000000000000000099`,
      authHeaders("user1")
    );
    expect(response.status).toBe(200);
    expect(response.data).toBeNull();
  });

  it("GET /dashboard/scenarios/:scenarioId/scenes returns all scenes with components", async () => {
    const response = await axios.get(
      `http://localhost:${port}/api/dashboard/scenarios/${scenario._id}/scenes`,
      authHeaders("user1")
    );
    expect(response.status).toBe(200);
    expect(response.data).toHaveLength(2);
    const names = response.data.map((s) => s.name);
    expect(names).toContain("Scene 1");
    expect(names).toContain("Scene 2");
  });

  it("GET /dashboard/scenarios/:scenarioId/scenes returns 404 for unknown scenario", async () => {
    await expect(
      axios.get(
        `http://localhost:${port}/api/dashboard/scenarios/000000000000000000000099/scenes`,
        authHeaders("user1")
      )
    ).rejects.toMatchObject({ response: { status: 404 } });
  });

  it("GET /dashboard/scenarios/:scenarioId/groups returns groups for the scenario", async () => {
    const response = await axios.get(
      `http://localhost:${port}/api/dashboard/scenarios/${scenario._id}/groups`,
      authHeaders("user1")
    );
    expect(response.status).toBe(200);
    expect(response.data).toHaveLength(1);
    expect(response.data[0]._id).toBe(group._id.toString());
  });

  it("GET /dashboard/groups/:groupId returns the group", async () => {
    const response = await axios.get(
      `http://localhost:${port}/api/dashboard/groups/${group._id}`,
      authHeaders("user1")
    );
    expect(response.status).toBe(200);
    expect(response.data._id).toBe(group._id.toString());
    expect(response.data.scenarioId).toBe(scenario._id.toString());
  });

  it("GET /dashboard/groups/:groupId returns 404 for unknown group", async () => {
    await expect(
      axios.get(
        `http://localhost:${port}/api/dashboard/groups/000000000000000000000099`,
        authHeaders("user1")
      )
    ).rejects.toMatchObject({ response: { status: 404 } });
  });
});
