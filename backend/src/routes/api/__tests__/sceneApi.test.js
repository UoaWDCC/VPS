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
  const HTTP_NO_CONTENT = 204;

  let mongoServer;
  let server;
  let port;

  const scene1 = {
    _id: new mongoose.mongo.ObjectId("000000000000000000000003"),
    name: "Test Scene 1",
  };

  const scene2 = {
    _id: new mongoose.mongo.ObjectId("000000000000000000000004"),
    name: "Test Scene 2",
  };

  const scenario1 = {
    _id: new mongoose.mongo.ObjectId("000000000000000000000001"),
    name: "Test Scenario 1",
  };

  const scenario2 = {
    _id: new mongoose.mongo.ObjectId("000000000000000000000002"),
    name: "Test Scenario 2",
    scenes: [scene1._id, scene2._id],
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

  // populate database with dummy scenarios
  beforeEach(async () => {
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
    expect(dbScenario2.scenes).toEqual([scene1._id, scene2._id]);
  });

  it("GET api/scenario/:scenarioId/scene retrieve all scenes successfully", async () => {
    const response = await axios.get(
      `http://localhost:${port}/api/scenario/${scenario2._id}/scene/`
    );
    expect(response.status).toBe(HTTP_OK);

    // check correct scenes are returned
    const scenes = response.data;
    expect(scenes).toHaveLength(2);

    expect(scenes[0]._id).toBe(scene1._id.toString());
    expect(scenes[0].name).toEqual(scene1.name);
    expect(scenes[0].components).toBeUndefined();

    expect(scenes[1]._id).toBe(scene2._id.toString());
    expect(scenes[1].name).toEqual(scene2.name);
    expect(scenes[1].components).toBeUndefined();
  });

  it("GET api/scenario/:scenarioId/scene/full/:sceneId retrieve scene successfully", async () => {
    const response = await axios.get(
      `http://localhost:${port}/api/scenario/${
        scenario2._id
      }/scene/full/${scene1._id.toString()}`
    );
    expect(response.status).toBe(HTTP_OK);

    // check correct scenes are returned
    const scene = response.data;
    expect(scene).toBeDefined();
    expect(scene._id).toBe(scene1._id.toString());
  });

  it("DELETE api/scenario/:scenarioId/scene/:sceneId deletes a valid scene", async () => {
    const response = await axios.delete(
      `http://localhost:${port}/api/scenario/${scenario2._id}/scene/${scene1._id}/`
    );
    expect(response.status).toBe(HTTP_NO_CONTENT);

    // check scene has been removed
    const dbScene1 = await Scene.findById(scene1._id);
    expect(dbScene1).toEqual(null);

    // check scene is removed from corresponding scenario
    const dbScenario2 = await Scenario.findById(scenario2._id).lean();
    expect(dbScenario2.scenes).toEqual([scene2._id]);

    // TODO: check corresponding components are removed
  });

  it("DELETE api/scenario/:scenarioId/scene/:sceneId returns 404 with invalid IDs", async () => {
    // bad sceneId
    await expect(
      axios.delete(
        `http://localhost:${port}/api/scenario/${scenario2._id}/scene/000000000000000000000009/`
      )
    ).rejects.toThrow();

    // bad scenarioId
    await expect(
      axios.delete(
        `http://localhost:${port}/api/scenario/000000000000000000000009/scene/${scene1._id}/`
      )
    ).rejects.toThrow();
  });
});
