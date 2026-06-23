import { jest, describe, beforeEach, it, expect } from "@jest/globals";

import express from "express";
import mongoose from "mongoose";
import axios from "axios";
import routes from "../../index.js";
import Scenario from "../../../db/models/scenario.js";
import Scene from "../../../db/models/scene.js";
import auth from "../../../middleware/firebaseAuth.js";
import scenarioAuth from "../../../middleware/scenarioAuth.js";
import Access from "../../../db/models/access.js";
import { authHeaders } from "./testHelpers.js";
import {
  useMongoMemoryServer,
  useExpressServer,
} from "../../../test/testSetup.js";

jest.mock("../../../middleware/firebaseAuth");
jest.mock("../../../middleware/scenarioAuth");
jest.mock("firebase-admin"); // Needed to mock the firebase-admin dependency in firebase-auth.js

// Mock the firebase auth middleware to have the auth token be the user id
auth.mockImplementation(async (req, res, next) => {
  req.body.uid = req.headers.authorization.split(" ")[1];
  next();
});

scenarioAuth.mockImplementation(async (req, res, next) => {
  next();
});

describe("Scenario API tests", () => {
  const HTTP_OK = 200;
  const HTTP_BAD_REQUEST = 400;

  useMongoMemoryServer();
  const ctx = useExpressServer(() => {
    const app = express();
    app.use(express.json());
    app.use("/", routes);
    return app;
  });

  const scene1 = {
    _id: new mongoose.mongo.ObjectId("000000000000000000000003"),
    name: "Scene 1",
  };

  const scene2 = {
    _id: new mongoose.mongo.ObjectId("000000000000000000000004"),
    name: "Scene 2",
  };

  const scenario1 = {
    _id: new mongoose.mongo.ObjectId("000000000000000000000001"),
    name: "Scenario 1",
    uid: "user1",
  };
  const scenario2 = {
    _id: new mongoose.mongo.ObjectId("000000000000000000000002"),
    name: "Scenario 2",
    scenes: [scene1._id, scene2._id],
    uid: "user1",
  };

  const access1 = {
    scenarioId: new mongoose.mongo.ObjectId("000000000000000000000001"),
    name: "Scenario 1",
    ownerId: "user1",
    users: {},
  };

  const access2 = {
    scenarioId: new mongoose.mongo.ObjectId("000000000000000000000002"),
    name: "Scenario 2",
    ownerId: "user1",
    users: {},
  };

  beforeEach(async () => {
    await Scenario.create([scenario1, scenario2]);
    await Access.create([access1, access2]);
    await Scene.create([scene1, scene2]);
  });

  it("creates and returns the newly persisted scenario", async () => {
    const reqData = {
      name: "Test Scenario 1",
    };

    const response = await axios.post(
      `http://localhost:${ctx.port}/api/scenario/`,
      reqData,
      authHeaders("user1")
    );
    expect(response.status).toBe(HTTP_OK);

    // check correct scenario is returned
    const scenario = response.data;
    expect(scenario._id).toBeDefined();
    expect(scenario.name).toEqual(reqData.name);
    expect(scenario.scenes).toHaveLength(1);
    expect(scenario.uid).toEqual("user1");

    // check if scenario has been persisted to db
    const dbScenario = await Scenario.findById(scenario._id).lean();
    expect(dbScenario).toBeDefined();
    expect(dbScenario.name).toEqual(reqData.name);
    expect(dbScenario.scenes).toHaveLength(1);
    expect(dbScenario.uid).toEqual("user1");

    const dbScene = await Scene.findById(dbScenario.scenes[0]).lean();
    expect(dbScene).toBeDefined();
    expect(dbScene.name).toEqual("Scene 1");
  });

  it("GET /scenario: retrieve all scenarios successfully", async () => {
    const response = await axios.get(
      `http://localhost:${ctx.port}/api/scenario/`,
      authHeaders("user1")
    );
    expect(response.status).toBe(HTTP_OK);

    // check correct scenario is returned
    const scenarios = response.data;
    expect(scenarios).toHaveLength(2);

    expect(scenarios[0]._id).toBe(scenario1._id.toString());
    expect(scenarios[0].name).toEqual(scenario1.name);
    expect(scenarios[0].scenes).toBeUndefined();

    expect(scenarios[1]._id).toBe(scenario2._id.toString());
    expect(scenarios[1].name).toEqual(scenario2.name);
    expect(scenarios[1].scenes).toBeUndefined();
  });

  it("DELETE api/scenario/:scenarioId deletes a valid scenario", async () => {
    const response = await axios.delete(
      `http://localhost:${ctx.port}/api/scenario/${scenario2._id}/`,
      authHeaders("user1")
    );
    expect(response.status).toBe(HTTP_OK);

    // check scenario has been removed
    const dbScenario2 = await Scenario.findById(scenario2._id);
    expect(dbScenario2).toEqual(null);

    // check corresponding scenes are removed
    const dbScene1 = await Scene.findById(scene1._id);
    const dbScene2 = await Scene.findById(scene2._id);
    expect(dbScene1).toEqual(null);
    expect(dbScene2).toEqual(null);

    // check corresponding access list is removed
    const dbAccess2 = await Access.findOne({
      scenarioId: scenario2._id.toString(),
    });
    expect(dbAccess2).toBeNull();

    // TODO: check corresponding components are removed
  });

  it("DELETE api/scenario/:scenarioId returns 404 with invalid ID", async () => {
    // bad scenarioId
    await expect(
      axios.delete(
        `http://localhost:${ctx.port}/api/scenario/000000000000000000000009/`,
        authHeaders("user1")
      )
    ).rejects.toThrow();
  });

  it("update a scenarios name", async () => {
    const response = await axios.put(
      `http://localhost:${ctx.port}/api/scenario/${scenario1._id}`,
      { name: "Scenario 2" },
      authHeaders("user1")
    );
    expect(response.status).toBe(HTTP_OK);

    // check correct scenario is returned
    const scenario = response.data;
    expect(scenario._id).toBeDefined();
    expect(scenario.name).toEqual("Scenario 2");
    expect(scenario.scenes).toEqual([]);

    // check if scenario has been persisted to db
    const dbScenario = await Scenario.findById(scenario._id).lean();
    expect(dbScenario).toBeDefined();
    expect(dbScenario.name).toEqual("Scenario 2");
    expect(dbScenario.scenes).toEqual([]);
  });

  it("GET /scenario/assigned returns assigned scenarios for a user", async () => {
    const response = await axios.get(
      `http://localhost:${ctx.port}/api/scenario/assigned`,
      authHeaders("user1")
    );
    expect(response.status).toBe(HTTP_OK);
    expect(Array.isArray(response.data)).toBe(true);
  });

  it("GET /scenario/all returns owned, assigned, and accessible scenario groups", async () => {
    const response = await axios.get(
      `http://localhost:${ctx.port}/api/scenario/all`,
      authHeaders("user1")
    );
    expect(response.status).toBe(HTTP_OK);
    expect(Array.isArray(response.data.owned)).toBe(true);
    expect(Array.isArray(response.data.assigned)).toBe(true);
    expect(Array.isArray(response.data.accessible)).toBe(true);
  });

  it("GET /scenario/:scenarioId returns the scenario", async () => {
    const response = await axios.get(
      `http://localhost:${ctx.port}/api/scenario/${scenario1._id}`,
      authHeaders("user1")
    );
    expect(response.status).toBe(HTTP_OK);
    expect(response.data._id).toBe(scenario1._id.toString());
    expect(response.data.name).toBe(scenario1.name);
  });

  it("GET /scenario/:scenarioId returns 400 for a malformed id", async () => {
    await expect(
      axios.get(
        `http://localhost:${ctx.port}/api/scenario/not-a-valid-id`,
        authHeaders("user1")
      )
    ).rejects.toMatchObject({ response: { status: HTTP_BAD_REQUEST } });
  });

  it("PATCH /scenario/:scenarioId updates scenario fields", async () => {
    const response = await axios.patch(
      `http://localhost:${ctx.port}/api/scenario/${scenario1._id}`,
      { name: "Patched Name", description: "New desc" },
      authHeaders("user1")
    );
    expect(response.status).toBe(HTTP_OK);
    const dbScenario = await Scenario.findById(scenario1._id).lean();
    expect(dbScenario.name).toBe("Patched Name");
    expect(dbScenario.description).toBe("New desc");
  });

  it("PATCH /scenario/:scenarioId returns 400 for a malformed id", async () => {
    await expect(
      axios.patch(
        `http://localhost:${ctx.port}/api/scenario/not-a-valid-id`,
        { name: "x" },
        authHeaders("user1")
      )
    ).rejects.toMatchObject({ response: { status: HTTP_BAD_REQUEST } });
  });

  it("GET /scenario/:scenarioId/stateVariables returns state variables array", async () => {
    const response = await axios.get(
      `http://localhost:${ctx.port}/api/scenario/${scenario1._id}/stateVariables`,
      authHeaders("user1")
    );
    expect(response.status).toBe(HTTP_OK);
    expect(Array.isArray(response.data)).toBe(true);
  });

  it("POST /scenario/:scenarioId/stateVariables creates a state variable", async () => {
    const newStateVariable = {
      name: "health",
      type: "number",
      defaultValue: 100,
    };
    const response = await axios.post(
      `http://localhost:${ctx.port}/api/scenario/${scenario1._id}/stateVariables`,
      { newStateVariable },
      authHeaders("user1")
    );
    expect(response.status).toBe(HTTP_OK);
    expect(response.data).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: "health" })])
    );
    const dbScenario = await Scenario.findById(scenario1._id).lean();
    expect(dbScenario.stateVariables).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: "health" })])
    );
  });

  it("PUT /scenario/:scenarioId/stateVariables edits an existing state variable", async () => {
    await axios.post(
      `http://localhost:${ctx.port}/api/scenario/${scenario1._id}/stateVariables`,
      {
        newStateVariable: { name: "health", type: "number", defaultValue: 100 },
      },
      authHeaders("user1")
    );

    const response = await axios.put(
      `http://localhost:${ctx.port}/api/scenario/${scenario1._id}/stateVariables`,
      {
        originalName: "health",
        newStateVariable: { name: "health", type: "number", defaultValue: 50 },
      },
      authHeaders("user1")
    );
    expect(response.status).toBe(HTTP_OK);
    expect(response.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "health", defaultValue: 50 }),
      ])
    );
  });

  it("DELETE /scenario/:scenarioId/stateVariables/:id removes a state variable", async () => {
    await axios.post(
      `http://localhost:${ctx.port}/api/scenario/${scenario1._id}/stateVariables`,
      { newStateVariable: { name: "score", type: "number", defaultValue: 0 } },
      authHeaders("user1")
    );

    const response = await axios.delete(
      `http://localhost:${ctx.port}/api/scenario/${scenario1._id}/stateVariables/score`,
      authHeaders("user1")
    );
    expect(response.status).toBe(HTTP_OK);
    expect(response.data).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ name: "score" })])
    );
  });
});
