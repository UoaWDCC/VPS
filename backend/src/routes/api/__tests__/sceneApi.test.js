import { jest, describe, beforeEach, it, expect } from "@jest/globals";

import express from "express";
import mongoose from "mongoose";
import axios from "axios";
import routes from "../../index.js";
import Scene from "../../../db/models/scene.js";
import Scenario from "../../../db/models/scenario.js";
import auth from "../../../middleware/firebaseAuth.js";
import scenarioAuth from "../../../middleware/scenarioAuth.js";
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

describe("Scene API tests", () => {
  const HTTP_OK = 200;

  useMongoMemoryServer();
  const ctx = useExpressServer(() => {
    const app = express();
    app.use(express.json());
    app.use("/", routes);
    return app;
  });

  const scene1 = {
    _id: new mongoose.mongo.ObjectId("000000000000000000000003"),
    name: "Test Scene 1",
    components: [
      {
        _id: 1,
        properties: { type: "Button" },
      },
      {
        _id: 2,
        properties: { type: "Text" },
      },
    ],
  };

  const scene2 = {
    _id: new mongoose.mongo.ObjectId("000000000000000000000004"),
    name: "Test Scene 2",
  };

  const scene3 = {
    _id: new mongoose.mongo.ObjectId("000000000000000000000005"),
    name: "Only Scene",
  };

  const scenario1 = {
    _id: new mongoose.mongo.ObjectId("000000000000000000000001"),
    name: "Test Scenario 1",
    uid: "user1",
  };

  const scenario2 = {
    _id: new mongoose.mongo.ObjectId("000000000000000000000002"),
    name: "Test Scenario 2",
    scenes: [scene1._id, scene2._id],
    uid: "user1",
  };

  const scenario3 = {
    _id: new mongoose.mongo.ObjectId("000000000000000000000006"),
    name: "Test Scenario 3",
    scenes: [scene3._id],
    uid: "user1",
  };

  beforeEach(async () => {
    await Scenario.create([scenario1, scenario2, scenario3]);
    await Scene.create([scene1, scene2, scene3]);
  });

  it("creates and returns the newly persisted scene", async () => {
    const reqData = {
      name: "Test Scene 1",
    };

    const response = await axios.post(
      `http://localhost:${ctx.port}/api/scenario/${scenario1._id}/scene/`,
      reqData,
      authHeaders("user1")
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

  it("creates a scene with components and returns the newly persisted scene", async () => {
    const components = [
      { _id: 1, name: "component 1", properties: { type: "Button" } },
      { _id: 2, name: "component 2", properties: { type: "Text" } },
    ];
    const reqData = {
      name: "Test Scene 1 Copy",
      components,
    };

    const response = await axios.post(
      `http://localhost:${ctx.port}/api/scenario/${scenario1._id}/scene/`,
      reqData,
      authHeaders("user1")
    );
    expect(response.status).toBe(HTTP_OK);

    // check correct scene is returned
    const responseScene = response.data;
    expect(responseScene._id).toBeDefined();
    expect(responseScene.name).toEqual(reqData.name);
    expect(responseScene.components).toHaveLength(2);
    expect(responseScene.components).toEqual(components);

    // check if scene has been persisted to db
    const dbScene = await Scene.findById(responseScene._id).lean();
    expect(dbScene).toBeDefined();
    expect(dbScene.name).toEqual(reqData.name);
    expect(dbScene.components).toHaveLength(2);
    expect(dbScene.components).toEqual(components);

    // check if scene has been added to the corresponding scenario
    const dbScenario1 = await Scenario.findById(scenario1._id).lean();
    const scenarioScenes = dbScenario1.scenes.map((e) => {
      return e.toString();
    });
    expect(scenarioScenes).toEqual([responseScene._id]);

    // check scene is not added to unrelated scenario
    const dbScenario2 = await Scenario.findById(scenario2._id).lean();
    expect(dbScenario2.scenes).toEqual([scene1._id, scene2._id]);
  });

  it("GET api/scenario/:scenarioId/scene retrieve all scenes successfully", async () => {
    const response = await axios.get(
      `http://localhost:${ctx.port}/api/scenario/${scenario2._id}/scene/`,
      authHeaders("user1")
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
      `http://localhost:${ctx.port}/api/scenario/${
        scenario2._id
      }/scene/full/${scene1._id.toString()}`,
      authHeaders("user1")
    );
    expect(response.status).toBe(HTTP_OK);

    // check correct scenes are returned
    const scene = response.data;
    expect(scene).toBeDefined();
    expect(scene._id).toBe(scene1._id.toString());
  });

  it("PATCH api/scenario/:scenarioId/scene/:sceneId updates a scene", async () => {
    const reqData = {
      fields: {
        name: "Test Scene 1 updated name",
      },
      components: [],
      deletedComponentIds: [],
    };

    const response = await axios.patch(
      `http://localhost:${ctx.port}/api/scenario/${scenario2._id}/scene/${scene1._id}`,
      reqData,
      authHeaders("user1")
    );

    expect(response.status).toBe(HTTP_OK);

    const dbScene = await Scene.findById(scene1._id).lean();
    expect(dbScene.name).toBe("Test Scene 1 updated name");
    expect(dbScene.components).toEqual(scene1.components);
  });

  it("PUT api/scenario/:scenarioId/scene/reorder updates scene order", async () => {
    const reqData = {
      sceneIds: [scene2._id.toString(), scene1._id.toString()],
    };

    const response = await axios.put(
      `http://localhost:${ctx.port}/api/scenario/${scenario2._id}/scene/reorder`,
      reqData,
      authHeaders("user1")
    );

    expect(response.status).toBe(HTTP_OK);
    expect(response.data.scenes).toEqual(reqData.sceneIds);

    const dbScenario = await Scenario.findById(scenario2._id).lean();
    expect(dbScenario.scenes).toEqual([scene2._id, scene1._id]);
  });

  it("PUT api/scenario/:scenarioId/scene/reorder prevents changing scene count", async () => {
    let error;

    try {
      await axios.put(
        `http://localhost:${ctx.port}/api/scenario/${scenario2._id}/scene/reorder`,
        { sceneIds: [scene1._id.toString()] },
        authHeaders("user1")
      );
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.response.status).toBe(409);
    expect(error.response.data.error).toBe(
      "Reordering must preserve the number of scenes."
    );

    const dbScenario = await Scenario.findById(scenario2._id).lean();
    expect(dbScenario.scenes).toEqual([scene1._id, scene2._id]);
  });

  it("DELETE api/scenario/:scenarioId/scene/:sceneId deletes a valid scene", async () => {
    const response = await axios.delete(
      `http://localhost:${ctx.port}/api/scenario/${scenario2._id}/scene/${scene1._id}/`,
      authHeaders("user1")
    );
    expect(response.status).toBe(HTTP_OK);

    // check scene has been removed
    const dbScene1 = await Scene.findById(scene1._id);
    expect(dbScene1).toEqual(null);

    // check scene is removed from corresponding scenario
    const dbScenario2 = await Scenario.findById(scenario2._id).lean();
    expect(dbScenario2.scenes).toEqual([scene2._id]);

    // TODO: check corresponding components are removed
  });

  it("DELETE api/scenario/:scenarioId/scene/:sceneId prevents deleting the only scene", async () => {
    let error;

    try {
      await axios.delete(
        `http://localhost:${ctx.port}/api/scenario/${scenario3._id}/scene/${scene3._id}/`,
        authHeaders("user1")
      );
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.response.status).toBe(409);
    expect(error.response.data.error).toBe(
      "A scenario must have at least one scene."
    );

    const dbScene = await Scene.findById(scene3._id);
    expect(dbScene).toBeDefined();

    const dbScenario = await Scenario.findById(scenario3._id).lean();
    expect(dbScenario.scenes).toEqual([scene3._id]);
  });

  it("DELETE api/scenario/:scenarioId/scene/:sceneId returns 404 with invalid IDs", async () => {
    // bad sceneId
    await expect(
      axios.delete(
        `http://localhost:${ctx.port}/api/scenario/${scenario2._id}/scene/000000000000000000000009/`,
        authHeaders("user1")
      )
    ).rejects.toThrow();

    // bad scenarioId
    await expect(
      axios.delete(
        `http://localhost:${ctx.port}/api/scenario/000000000000000000000009/scene/${scene1._id}/`,
        authHeaders("user1")
      )
    ).rejects.toThrow();
  });

  it("POST /duplicate: duplicates a scene and returns the newly persisted scene", async () => {
    const response = await axios.post(
      `http://localhost:${ctx.port}/api/scenario/${scenario2._id}/scene/duplicate/${scene1._id}`,
      {},
      authHeaders("user1")
    );
    expect(response.status).toBe(HTTP_OK);

    // check correct scene is returned and has different id to original scene
    const responseScene = response.data;
    expect(responseScene._id).toBeDefined();
    expect(responseScene._id).not.toBe(scene1._id.toString());
    expect(responseScene.name).toBe(`${scene1.name} Copy`);

    // check components are the same
    expect(responseScene.components).toHaveLength(2);
    expect(responseScene.components).toEqual(scene1.components);

    // check if scene has been persisted to db
    const dbScene = await Scene.findById(responseScene._id).lean();
    expect(dbScene).toBeDefined();
    expect(dbScene.name).toEqual(responseScene.name);
    expect(dbScene.components).toHaveLength(2);
    expect(dbScene.components).toEqual(responseScene.components);

    // check if scene has been added to the corresponding scenario
    const dbScenario2 = await Scenario.findById(scenario2._id).lean();
    const scenarioScenes = dbScenario2.scenes.map((e) => {
      return e.toString();
    });
    expect(scenarioScenes).toEqual([
      scene1._id.toString(),
      scene2._id.toString(),
      responseScene._id,
    ]);

    // check scene is not added to unrelated scenario
    const dbScenario1 = await Scenario.findById(scenario1._id).lean();
    expect(dbScenario1.scenes).toEqual([]);
  });
});
