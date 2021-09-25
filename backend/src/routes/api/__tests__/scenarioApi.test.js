/* eslint-disable no-underscore-dangle */
import { MongoMemoryServer } from "mongodb-memory-server";
import express from "express";
import mongoose from "mongoose";
import axios from "axios";
import routes from "../..";
import Scenario from "../../../db/models/scenario";
import Scene from "../../../db/models/scene";
import auth from "../../../middleware/firebaseAuth";
import scenarioAuth from "../../../middleware/scenarioAuth";

jest.mock("../../../middleware/firebaseAuth");
jest.mock("../../../middleware/scenarioAuth");
jest.mock("firebase-admin"); // Needed to mock the firebase-admin dependency in firebase-auth.js

// Mock the firebase auth middleware to have the auth token be the user id
auth.mockImplementation(async (req, res, next) => {
  // eslint-disable-next-line prefer-destructuring
  req.body.uid = req.headers.authorization.split(" ")[1];
  next();
});

scenarioAuth.mockImplementation(async (req, res, next) => {
  next();
});

function authHeaders(id) {
  return {
    headers: {
      Authorization: `Bearer ${id}`,
    },
  };
}

describe("Scenario API tests", () => {
  const HTTP_OK = 200;
  const HTTP_NO_CONTENT = 204;

  let mongoServer;
  let server;
  let port;

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

  beforeEach(async () => {
    // Add scenario to database
    await Scenario.create([scenario1, scenario2]);
    await Scene.create([scene1, scene2]);
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

  it("creates and returns the newly persisted scenario", async () => {
    const reqData = {
      name: "Test Scenario 1",
    };

    const response = await axios.post(
      `http://localhost:${port}/api/scenario/`,
      reqData,
      authHeaders("user1")
    );
    expect(response.status).toBe(HTTP_OK);

    // check correct scenario is returned
    const scenario = response.data;
    expect(scenario._id).toBeDefined();
    expect(scenario.name).toEqual(reqData.name);
    expect(scenario.scenes).toEqual([]);
    expect(scenario.uid).toEqual("user1");

    // check if scenario has been persisted to db
    const dbScenario = await Scenario.findById(scenario._id).lean();
    expect(dbScenario).toBeDefined();
    expect(dbScenario.name).toEqual(reqData.name);
    expect(dbScenario.scenes).toEqual([]);
    expect(dbScenario.uid).toEqual("user1");
  });

  it("GET /scenario: retrieve all scenarios successfully", async () => {
    const response = await axios.get(
      `http://localhost:${port}/api/scenario/`,
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
      `http://localhost:${port}/api/scenario/${scenario2._id}/`,
      authHeaders("user1")
    );
    expect(response.status).toBe(HTTP_NO_CONTENT);

    // check scenario has been removed
    const dbScenario2 = await Scenario.findById(scenario2._id);
    expect(dbScenario2).toEqual(null);

    // check corresponding scenes are removed
    const dbScene1 = await Scene.findById(scene1._id);
    const dbScene2 = await Scene.findById(scene2._id);
    expect(dbScene1).toEqual(null);
    expect(dbScene2).toEqual(null);

    // TODO: check corresponding components are removed
  });

  it("DELETE api/scenario/:scenarioId returns 404 with invalid ID", async () => {
    // bad scenarioId
    await expect(
      axios.delete(
        `http://localhost:${port}/api/scenario/000000000000000000000009/`,
        authHeaders("user1")
      )
    ).rejects.toThrow();
  });

  it("update a scenarios name", async () => {
    const response = await axios.put(
      `http://localhost:${port}/api/scenario/${scenario1._id}`,
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
});
