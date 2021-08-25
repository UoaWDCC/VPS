/* eslint-disable no-underscore-dangle */
import { MongoMemoryServer } from "mongodb-memory-server";
import express from "express";
import mongoose from "mongoose";
import axios from "axios";
import routes from "../..";
import Scenario from "../../../db/models/scenario";

describe("Scenario API tests", () => {
  const HTTP_OK = 200;

  let mongoServer;
  let server;
  let port;

  const scenario1 = {
    _id: new mongoose.mongo.ObjectId("000000000000000000000001"),
    name: "Scenario 1",
  };
  const scenario2 = {
    _id: new mongoose.mongo.ObjectId("000000000000000000000002"),
    name: "Scenario 2",
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
      reqData
    );
    expect(response.status).toBe(HTTP_OK);

    // check correct scenario is returned
    const scenario = response.data;
    expect(scenario._id).toBeDefined();
    expect(scenario.name).toEqual(reqData.name);
    expect(scenario.scenes).toEqual([]);

    // check if scenario has been persisted to db
    const dbScenario = await Scenario.findById(scenario._id).lean();
    expect(dbScenario).toBeDefined();
    expect(dbScenario.name).toEqual(reqData.name);
    expect(dbScenario.scenes).toEqual([]);
  });

  it("GET /scenario: retrieve all scenarios successfully", async () => {
    const response = await axios.get(`http://localhost:${port}/api/scenario/`);
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
});
