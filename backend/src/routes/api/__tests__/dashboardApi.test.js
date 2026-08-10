import { jest, describe, beforeEach, it, expect } from "@jest/globals";

import express from "express";
import axios from "axios";
import routes from "../../index.js";
import Scenario from "../../../db/models/scenario.js";
import Scene from "../../../db/models/scene.js";
import Group from "../../../db/models/group.js";
import auth from "../../../middleware/firebaseAuth.js";
import scenarioAuth, {
  scenarioOwnerAuth,
} from "../../../middleware/scenarioAuth.js";
import errorHandler from "../../../middleware/errorHandler.js";
import { authHeaders } from "./testHelpers.js";
import {
  useMongoMemoryServer,
  useExpressServer,
} from "../../../test/testSetup.js";

jest.mock("../../../middleware/firebaseAuth");
jest.mock("../../../middleware/scenarioAuth");
jest.mock("firebase-admin");

auth.mockImplementation(async (req, res, next) => {
  req.body.uid = req.headers.authorization?.split(" ")[1];
  next();
});

scenarioAuth.mockImplementation(async (req, res, next) => {
  next();
});

scenarioOwnerAuth.mockImplementation(async (req, res, next) => {
  next();
});

describe("Dashboard API tests", () => {
  useMongoMemoryServer();
  const ctx = useExpressServer(() => {
    const app = express();
    app.use(express.json());
    app.use("/", routes);
    app.use(errorHandler);
    return app;
  });

  let scenario;
  let scene1;
  let scene2;
  let group;

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
  });

  it("GET /dashboard/scenarios/:scenarioId returns the scenario", async () => {
    const response = await axios.get(
      `http://localhost:${ctx.port}/api/dashboard/scenarios/${scenario._id}`,
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
      `http://localhost:${ctx.port}/api/dashboard/scenarios/000000000000000000000099`,
      authHeaders("user1")
    );
    expect(response.status).toBe(200);
    expect(response.data).toBeNull();
  });

  it("GET /dashboard/scenarios/:scenarioId/scenes returns all scenes with components", async () => {
    const response = await axios.get(
      `http://localhost:${ctx.port}/api/dashboard/scenarios/${scenario._id}/scenes`,
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
        `http://localhost:${ctx.port}/api/dashboard/scenarios/000000000000000000000099/scenes`,
        authHeaders("user1")
      )
    ).rejects.toMatchObject({ response: { status: 404 } });
  });

  it("GET /dashboard/scenarios/:scenarioId/groups returns groups for the scenario", async () => {
    const response = await axios.get(
      `http://localhost:${ctx.port}/api/dashboard/scenarios/${scenario._id}/groups`,
      authHeaders("user1")
    );
    expect(response.status).toBe(200);
    expect(response.data).toHaveLength(1);
    expect(response.data[0]._id).toBe(group._id.toString());
  });

  it("GET /dashboard/groups/:groupId returns the group", async () => {
    const response = await axios.get(
      `http://localhost:${ctx.port}/api/dashboard/groups/${group._id}`,
      authHeaders("user1")
    );
    expect(response.status).toBe(200);
    expect(response.data._id).toBe(group._id.toString());
    expect(response.data.scenarioId).toBe(scenario._id.toString());
  });

  it("GET /dashboard/groups/:groupId returns 404 for unknown group", async () => {
    await expect(
      axios.get(
        `http://localhost:${ctx.port}/api/dashboard/groups/000000000000000000000099`,
        authHeaders("user1")
      )
    ).rejects.toMatchObject({ response: { status: 404 } });
  });

  it("PATCH /dashboard/scenarios/:scenarioId/groups/:groupId/revoke removes the member", async () => {
    const response = await axios.patch(
      `http://localhost:${ctx.port}/api/dashboard/scenarios/${scenario._id}/groups/${group._id}/revoke`,
      { email: "P@Example.com" },
      authHeaders("user1")
    );
    expect(response.status).toBe(200);
    expect(response.data.users).toHaveLength(0);

    const updated = await Group.findById(group._id);
    expect(updated.users).toHaveLength(0);
  });

  it("PATCH /dashboard/scenarios/:scenarioId/groups/:groupId/revoke returns 400 for an invalid email", async () => {
    await expect(
      axios.patch(
        `http://localhost:${ctx.port}/api/dashboard/scenarios/${scenario._id}/groups/${group._id}/revoke`,
        { email: "not-an-email" },
        authHeaders("user1")
      )
    ).rejects.toMatchObject({ response: { status: 400 } });
  });

  it("PATCH /dashboard/scenarios/:scenarioId/groups/:groupId/revoke returns 404 for an unknown group", async () => {
    await expect(
      axios.patch(
        `http://localhost:${ctx.port}/api/dashboard/scenarios/${scenario._id}/groups/000000000000000000000099/revoke`,
        { email: "p@example.com" },
        authHeaders("user1")
      )
    ).rejects.toMatchObject({ response: { status: 404 } });
  });

  it("PATCH /dashboard/scenarios/:scenarioId/groups/:groupId/revoke returns 404 and does not modify a group that belongs to a different scenario", async () => {
    const otherScenario = await Scenario.create({
      name: "Other Scenario",
      uid: "user2",
    });

    await expect(
      axios.patch(
        `http://localhost:${ctx.port}/api/dashboard/scenarios/${otherScenario._id}/groups/${group._id}/revoke`,
        { email: "p@example.com" },
        authHeaders("user2")
      )
    ).rejects.toMatchObject({ response: { status: 404 } });

    const untouched = await Group.findById(group._id);
    expect(untouched.users).toHaveLength(1);
  });
});
