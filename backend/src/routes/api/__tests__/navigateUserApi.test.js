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
import User from "../../../db/models/user.js";
import auth from "../../../middleware/firebaseAuth.js";
import { authHeaders } from "./testHelpers.js";

jest.mock("../../../middleware/firebaseAuth");
jest.mock("firebase-admin");

auth.mockImplementation(async (req, res, next) => {
  req.body.uid = req.headers.authorization?.split(" ")[1];
  next();
});

describe("Navigate User API tests", () => {
  let mongoServer;
  let server;
  let port;

  let scenario;
  let scene1;
  let scene2;
  let player;

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
    scene1 = await Scene.create({
      name: "Scene 1",
      components: [],
      roles: [],
    });

    scene2 = await Scene.create({
      name: "Scene 2",
      components: [],
      roles: [],
    });

    scenario = await Scenario.create({
      name: "User Nav Scenario",
      uid: "uid-author",
      scenes: [scene1._id, scene2._id],
      stateVariables: [],
    });

    player = await User.create({
      uid: "uid-player",
      name: "Player",
      email: "player@auckland.ac.nz",
      pictureURL: "http://example.com/p.png",
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

  // --- POST /navigate/user/:scenarioId (first navigation) ---

  it("POST /navigate/user/:scenarioId navigates to the first scene on initial visit", async () => {
    const response = await axios.post(
      `http://localhost:${port}/api/navigate/user/${scenario._id}`,
      { uid: "uid-player" },
      authHeaders("uid-player")
    );
    expect(response.status).toBe(200);
    expect(response.data.active).toBe(scene1._id.toString());
    expect(response.data.stateVariables).toBeDefined();

    // User path for this scenario should now start with scene1
    const dbUser = await User.findOne({ uid: "uid-player" });
    expect(dbUser.paths.get(scenario._id.toString())[0]).toBe(
      scene1._id.toString()
    );
  });

  it("POST /navigate/user/:scenarioId resumes at path head on session re-entry", async () => {
    // Give the user an existing path
    await User.findOneAndUpdate(
      { uid: "uid-player" },
      { $set: { [`paths.${scenario._id}`]: [scene1._id.toString()] } }
    );

    const response = await axios.post(
      `http://localhost:${port}/api/navigate/user/${scenario._id}`,
      { uid: "uid-player" }, // no currentScene → re-entry
      authHeaders("uid-player")
    );
    expect(response.status).toBe(200);
    expect(response.data.active).toBe(scene1._id.toString());
  });

  it("POST /navigate/user/:scenarioId returns 409 on scene mismatch", async () => {
    // Give user a path starting at scene1
    await User.findOneAndUpdate(
      { uid: "uid-player" },
      { $set: { [`paths.${scenario._id}`]: [scene1._id.toString()] } }
    );

    // Supply an incorrect currentScene
    await expect(
      axios.post(
        `http://localhost:${port}/api/navigate/user/${scenario._id}`,
        {
          uid: "uid-player",
          currentScene: scene2._id.toString(), // wrong — path head is scene1
        },
        authHeaders("uid-player")
      )
    ).rejects.toMatchObject({ response: { status: 409 } });
  });

  it("POST /navigate/user/:scenarioId navigates from one scene to the next via componentId", async () => {
    // Components are stored as plain objects ({ type: Object }); the DAO matches
    // on c.id, so we must set it explicitly.
    const componentId = "btn-go-to-scene2";
    const clickScene = await Scene.create({
      name: "Click Scene",
      components: [
        {
          id: componentId,
          clickable: true,
          nextScene: scene2._id,
          type: "BUTTON",
        },
      ],
      roles: [],
    });

    await User.findOneAndUpdate(
      { uid: "uid-player" },
      { $set: { [`paths.${scenario._id}`]: [clickScene._id.toString()] } }
    );

    // Navigate via componentId (not bodyNextScene — that triggers directLink validation)
    const response = await axios.post(
      `http://localhost:${port}/api/navigate/user/${scenario._id}`,
      {
        uid: "uid-player",
        currentScene: clickScene._id.toString(),
        componentId,
      },
      authHeaders("uid-player")
    );
    expect(response.status).toBe(200);
    expect(response.data.active).toBe(scene2._id.toString());

    const dbUser = await User.findOne({ uid: "uid-player" });
    expect(dbUser.paths.get(scenario._id.toString())[0]).toBe(
      scene2._id.toString()
    );
  });

  it("POST /navigate/user/:scenarioId returns 403 when nextScene does not match directLink", async () => {
    // scene1 has no directLink, providing nextScene without a valid directLink → 403
    await User.findOneAndUpdate(
      { uid: "uid-player" },
      { $set: { [`paths.${scenario._id}`]: [scene1._id.toString()] } }
    );

    await expect(
      axios.post(
        `http://localhost:${port}/api/navigate/user/${scenario._id}`,
        {
          uid: "uid-player",
          currentScene: scene1._id.toString(),
          nextScene: scene2._id.toString(), // not a directLink target
        },
        authHeaders("uid-player")
      )
    ).rejects.toMatchObject({ response: { status: 403 } });
  });

  // --- POST /navigate/user/reset/:scenarioId ---

  it("POST /navigate/user/reset/:scenarioId resets path when RESET_BUTTON is present", async () => {
    const resetScene = await Scene.create({
      name: "Reset Scene",
      components: [{ type: "RESET_BUTTON" }],
      roles: [],
    });

    await User.findOneAndUpdate(
      { uid: "uid-player" },
      { $set: { [`paths.${scenario._id}`]: [resetScene._id.toString()] } }
    );

    const response = await axios.post(
      `http://localhost:${port}/api/navigate/user/reset/${scenario._id}`,
      { uid: "uid-player", currentScene: resetScene._id.toString() },
      authHeaders("uid-player")
    );
    expect(response.status).toBe(200);

    const dbUser = await User.findOne({ uid: "uid-player" });
    expect(dbUser.paths.get(scenario._id.toString())).toBeUndefined();
  });

  it("POST /navigate/user/reset/:scenarioId returns 403 when scene has no RESET_BUTTON", async () => {
    await User.findOneAndUpdate(
      { uid: "uid-player" },
      { $set: { [`paths.${scenario._id}`]: [scene1._id.toString()] } }
    );

    await expect(
      axios.post(
        `http://localhost:${port}/api/navigate/user/reset/${scenario._id}`,
        { uid: "uid-player", currentScene: scene1._id.toString() },
        authHeaders("uid-player")
      )
    ).rejects.toMatchObject({ response: { status: 403 } });
  });

  it("POST /navigate/user/reset/:scenarioId returns 409 on scene mismatch", async () => {
    await User.findOneAndUpdate(
      { uid: "uid-player" },
      { $set: { [`paths.${scenario._id}`]: [scene1._id.toString()] } }
    );

    await expect(
      axios.post(
        `http://localhost:${port}/api/navigate/user/reset/${scenario._id}`,
        {
          uid: "uid-player",
          currentScene: scene2._id.toString(), // wrong
        },
        authHeaders("uid-player")
      )
    ).rejects.toMatchObject({ response: { status: 409 } });
  });
});
