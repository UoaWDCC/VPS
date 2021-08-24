/* eslint-disable no-underscore-dangle */
import { MongoMemoryServer } from "mongodb-memory-server";
import express from "express";
import mongoose from "mongoose";
import axios from "axios";
import routes from "../..";
import Scene from "../../../db/models/scene";
import Scenario from "../../../db/models/scenario";

describe("Scene API tests", () => {
  const HTTP_OK = 200;

  let mongoServer;
  let server;
  let port;

  let scenario1;
  let scenario2;

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

  // populate database with dummy scenarios
  beforeEach(async () => {
    scenario1 = new Scenario({ name: "Test Scenario 1" });
    scenario2 = new Scenario({ name: "Test Scenario 2" });
    await scenario1.save();
    await scenario2.save();
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

  it("creates and returns the newly persisted scene", async () => {
    const reqData = {
      name: "Test Scene 1",
    };

    const response = await axios.post(
      `http://localhost:${port}/api/scenario/${scenario1._id}/scene/`,
      reqData
    );
    expect(response.status).toBe(HTTP_OK);

    // check correct scene is returned
    const responseScene = response.data;
    expect(responseScene._id).toBeDefined();
    expect(responseScene.name).toEqual(reqData.name);
    expect(responseScene.components).toEqual([]);

    // check if scene has been persisted to db
    const dbScene = await Scene.findById(responseScene._id).lean();
    expect(dbScene).toBeDefined();
    expect(dbScene.name).toEqual(reqData.name);
    expect(dbScene.components).toEqual([]);

    // check if scene has been added to the corresponding scenario
    const dbScenario1 = await Scenario.findById(scenario1._id).lean();
    const scenarioScenes = dbScenario1.scenes.map((e) => {
      return e.toString();
    });
    expect(scenarioScenes).toEqual([responseScene._id]);

    // check scene is not added to unrelatd scenario
    const dbScenario2 = await Scenario.findById(scenario2._id).lean();
    expect(dbScenario2.scenes).toEqual([]);
  });
});
