import { jest, describe, beforeEach, it, expect } from "@jest/globals";

import express from "express";
import axios from "axios";
import routes from "../../index.js";
import Scenario from "../../../db/models/scenario.js";
import Scene from "../../../db/models/scene.js";
import User from "../../../db/models/user.js";
import auth from "../../../middleware/firebaseAuth.js";
import { authHeaders } from "./testHelpers.js";
import {
  useMongoMemoryServer,
  useExpressServer,
} from "../../../test/testSetup.js";

jest.mock("../../../middleware/firebaseAuth");
jest.mock("firebase-admin");

auth.mockImplementation(async (req, res, next) => {
  req.body.uid = req.headers.authorization?.split(" ")[1];
  next();
});

describe("Navigate User API tests", () => {
  useMongoMemoryServer();
  const ctx = useExpressServer(() => {
    const app = express();
    app.use(express.json());
    app.use("/", routes);
    return app;
  });

  let scenario;
  let scene1;
  let scene2;

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

    await User.create({
      uid: "uid-player",
      name: "Player",
      email: "player@auckland.ac.nz",
      pictureURL: "http://example.com/p.png",
    });
  });

  // --- POST /navigate/user/:scenarioId (first navigation) ---

  it("POST /navigate/user/:scenarioId navigates to the first scene on initial visit", async () => {
    const response = await axios.post(
      `http://localhost:${ctx.port}/api/navigate/user/${scenario._id}`,
      { uid: "uid-player" },
      authHeaders("uid-player")
    );
    expect(response.status).toBe(200);
    expect(response.data.active).toBe(scene1._id.toString());
    expect(response.data.properties).toBeDefined();

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
      `http://localhost:${ctx.port}/api/navigate/user/${scenario._id}`,
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
        `http://localhost:${ctx.port}/api/navigate/user/${scenario._id}`,
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
      `http://localhost:${ctx.port}/api/navigate/user/${scenario._id}`,
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
        `http://localhost:${ctx.port}/api/navigate/user/${scenario._id}`,
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
      `http://localhost:${ctx.port}/api/navigate/user/reset/${scenario._id}`,
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
        `http://localhost:${ctx.port}/api/navigate/user/reset/${scenario._id}`,
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
        `http://localhost:${ctx.port}/api/navigate/user/reset/${scenario._id}`,
        {
          uid: "uid-player",
          currentScene: scene2._id.toString(), // wrong
        },
        authHeaders("uid-player")
      )
    ).rejects.toMatchObject({ response: { status: 409 } });
  });

  // --- Server-authoritative scene timer ---

  describe("author flag and scene names", () => {
    const navigate = (uid, body = {}) =>
      axios.post(
        `http://localhost:${ctx.port}/api/navigate/user/${scenario._id}`,
        { uid, ...body },
        authHeaders(uid)
      );

    beforeEach(async () => {
      await User.create({
        uid: "uid-author",
        name: "Author",
        email: "author@auckland.ac.nz",
        pictureURL: "http://example.com/a.png",
      });
    });

    it("flags the scenario author on first navigation", async () => {
      const response = await navigate("uid-author");
      expect(response.status).toBe(200);
      expect(response.data.isAuthor).toBe(true);
    });

    it("does not flag a regular player on first navigation", async () => {
      const response = await navigate("uid-player");
      expect(response.data.isAuthor).toBe(false);
    });

    it("flags the author again when they re-enter an existing session", async () => {
      await navigate("uid-author");
      const response = await navigate("uid-author");
      expect(response.status).toBe(200);
      expect(response.data.isAuthor).toBe(true);
    });

    it("does not flag a regular player on re-entry", async () => {
      await navigate("uid-player");
      const response = await navigate("uid-player");
      expect(response.data.isAuthor).toBe(false);
    });

    it("leaves the flag out of mid-play moves", async () => {
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
        { uid: "uid-author" },
        { $set: { [`paths.${scenario._id}`]: [clickScene._id.toString()] } }
      );

      const response = await navigate("uid-author", {
        currentScene: clickScene._id.toString(),
        componentId,
      });
      expect(response.status).toBe(200);
      expect(response.data.isAuthor).toBeUndefined();
    });

    it("includes scene names for the active and connected scenes", async () => {
      const clickScene = await Scene.create({
        name: "Click Scene",
        components: [
          {
            id: "btn",
            clickable: true,
            nextScene: scene2._id,
            type: "BUTTON",
          },
        ],
        roles: [],
      });
      await Scenario.findByIdAndUpdate(scenario._id, {
        scenes: [clickScene._id, scene2._id],
      });

      const response = await navigate("uid-player");
      const names = Object.fromEntries(
        response.data.scenes.map((s) => [s._id, s.name])
      );
      expect(names[clickScene._id.toString()]).toBe("Click Scene");
      expect(names[scene2._id.toString()]).toBe("Scene 2");
    });
  });

  describe("author debug tools", () => {
    const debug = (uid, body, id = scenario._id) =>
      axios.post(
        `http://localhost:${ctx.port}/api/navigate/user/debug/${id}`,
        { uid, ...body },
        authHeaders(uid)
      );

    const defaults = [
      { id: "hr", name: "heartRate", type: "number", value: 110 },
    ];
    const played = [{ ...defaults[0], value: 50 }];

    beforeEach(async () => {
      await Scenario.findByIdAndUpdate(scenario._id, {
        stateVariables: defaults,
      });
      await User.create({
        uid: "uid-author",
        name: "Author",
        email: "author@auckland.ac.nz",
        pictureURL: "http://example.com/a.png",
      });
      // The author is part way through: on scene 2, with changed properties
      await User.findOneAndUpdate(
        { uid: "uid-author" },
        {
          $set: {
            [`paths.${scenario._id}`]: [scene2._id.toString()],
            [`stateVariables.${scenario._id}`]: played,
            [`stateVersions.${scenario._id}`]: 4,
          },
        }
      );
    });

    const dbAuthor = () => User.findOne({ uid: "uid-author" });

    it("all: starts again from the first scene with default properties", async () => {
      const response = await debug("uid-author", { mode: "all" });
      expect(response.status).toBe(200);
      expect(response.data.active).toBe(scene1._id.toString());
      expect(response.data.properties).toEqual(defaults);
      expect(response.data.propertyVersion).toBeGreaterThan(4);
      expect(response.data.isAuthor).toBe(true);

      const author = await dbAuthor();
      expect(author.paths.get(scenario._id.toString())).toEqual([
        scene1._id.toString(),
      ]);
      expect(author.stateVariables.get(scenario._id.toString())).toEqual(
        defaults
      );
    });

    it("all: restarts the timer for the first scene", async () => {
      await Scene.findByIdAndUpdate(scene1._id, { time: 90 });
      const response = await debug("uid-author", { mode: "all" });
      expect(response.data.remainingTime).toBe(90);
    });

    it("properties: resets the properties and stays on the current scene", async () => {
      const response = await debug("uid-author", { mode: "properties" });
      expect(response.status).toBe(200);
      expect(response.data.properties).toEqual(defaults);
      expect(response.data.propertyVersion).toBeGreaterThan(4);

      const author = await dbAuthor();
      expect(author.paths.get(scenario._id.toString())).toEqual([
        scene2._id.toString(),
      ]);
      expect(author.stateVariables.get(scenario._id.toString())).toEqual(
        defaults
      );
    });

    it("timer: restarts the timer of the current scene", async () => {
      await Scene.findByIdAndUpdate(scene2._id, { time: 120 });
      const stale = new Date(Date.now() - 100 * 1000);
      await User.findOneAndUpdate(
        { uid: "uid-author" },
        { $set: { [`sceneEnteredAt.${scenario._id}`]: stale } }
      );

      const response = await debug("uid-author", { mode: "timer" });
      expect(response.status).toBe(200);
      expect(response.data.remainingTime).toBe(120);

      const author = await dbAuthor();
      const restamped = author.sceneEnteredAt.get(scenario._id.toString());
      expect(restamped.getTime()).toBeGreaterThan(stale.getTime() + 90 * 1000);
    });

    it("timer: reports no time for a scene without a timer", async () => {
      const response = await debug("uid-author", { mode: "timer" });
      expect(response.data.remainingTime).toBeNull();
    });

    it("timer: returns 409 when there is no scene to restart", async () => {
      await User.findOneAndUpdate(
        { uid: "uid-author" },
        { $unset: { [`paths.${scenario._id}`]: "" } }
      );
      await expect(
        debug("uid-author", { mode: "timer" })
      ).rejects.toMatchObject({ response: { status: 409 } });
    });

    it("rejects an unknown mode", async () => {
      await expect(debug("uid-author", { mode: "nuke" })).rejects.toMatchObject(
        {
          response: { status: 400 },
        }
      );
    });

    it("rejects people who are not authors, leaving their playthrough alone", async () => {
      await User.findOneAndUpdate(
        { uid: "uid-player" },
        { $set: { [`paths.${scenario._id}`]: [scene2._id.toString()] } }
      );

      for (const mode of ["all", "properties", "timer"]) {
        await expect(debug("uid-player", { mode })).rejects.toMatchObject({
          response: { status: 401 },
        });
      }

      const player = await User.findOne({ uid: "uid-player" });
      expect(player.paths.get(scenario._id.toString())).toEqual([
        scene2._id.toString(),
      ]);
    });

    it("rejects an invalid scenario id", async () => {
      await expect(
        debug("uid-author", { mode: "all" }, "not-an-id")
      ).rejects.toMatchObject({ response: { status: 400 } });
    });

    describe("jumping to a scene (startScene)", () => {
      const jump = (uid, startScene) =>
        axios.post(
          `http://localhost:${ctx.port}/api/navigate/user/${scenario._id}`,
          { uid, startScene },
          authHeaders(uid)
        );

      it("lets an author jump to any scene and keeps their properties", async () => {
        await Scene.findByIdAndUpdate(scene1._id, { time: 60 });

        const response = await jump("uid-author", scene1._id.toString());
        expect(response.status).toBe(200);
        expect(response.data.active).toBe(scene1._id.toString());
        expect(response.data.remainingTime).toBe(60);
        expect(response.data.properties).toEqual(played);

        const author = await dbAuthor();
        expect(author.paths.get(scenario._id.toString())).toEqual([
          scene1._id.toString(),
        ]);
      });

      it("ignores startScene from someone who is not an author", async () => {
        // A player who has already started has a path and properties
        await User.findOneAndUpdate(
          { uid: "uid-player" },
          {
            $set: {
              [`paths.${scenario._id}`]: [scene1._id.toString()],
              [`stateVariables.${scenario._id}`]: defaults,
              [`stateVersions.${scenario._id}`]: 1,
            },
          }
        );

        const response = await jump("uid-player", scene2._id.toString());
        expect(response.data.active).toBe(scene1._id.toString());

        const player = await User.findOne({ uid: "uid-player" });
        expect(player.paths.get(scenario._id.toString())).toEqual([
          scene1._id.toString(),
        ]);
      });
    });
  });

  describe("scene timer", () => {
    const scenarioId = () => scenario._id.toString();

    it("returns the full remainingTime and stamps entry on first navigation", async () => {
      // Make the first scene timed.
      await Scene.findByIdAndUpdate(scene1._id, { time: 120 });

      const response = await axios.post(
        `http://localhost:${ctx.port}/api/navigate/user/${scenario._id}`,
        { uid: "uid-player" },
        authHeaders("uid-player")
      );
      expect(response.status).toBe(200);
      expect(response.data.remainingTime).toBe(120);

      const dbUser = await User.findOne({ uid: "uid-player" });
      expect(dbUser.sceneEnteredAt.get(scenarioId())).toBeInstanceOf(Date);
    });

    it("resumes with a decreased remainingTime on re-entry (refresh cannot reset it)", async () => {
      const timedScene = await Scene.create({
        name: "Timed",
        components: [],
        roles: [],
        time: 120,
      });
      // Entered 30s ago.
      const enteredAt = new Date(Date.now() - 30_000);
      await User.findOneAndUpdate(
        { uid: "uid-player" },
        {
          $set: {
            [`paths.${scenarioId()}`]: [timedScene._id.toString()],
            [`sceneEnteredAt.${scenarioId()}`]: enteredAt,
          },
        }
      );

      const response = await axios.post(
        `http://localhost:${ctx.port}/api/navigate/user/${scenario._id}`,
        { uid: "uid-player" }, // no currentScene → re-entry / refresh
        authHeaders("uid-player")
      );
      expect(response.status).toBe(200);
      // ~90s remaining, allowing a little for execution time — crucially not 120.
      expect(response.data.remainingTime).toBeGreaterThan(85);
      expect(response.data.remainingTime).toBeLessThanOrEqual(91);

      // The stamp must be untouched by a plain re-entry.
      const dbUser = await User.findOne({ uid: "uid-player" });
      expect(dbUser.sceneEnteredAt.get(scenarioId()).getTime()).toBe(
        enteredAt.getTime()
      );
    });

    it("resets remainingTime to full and restamps on a real scene move", async () => {
      const componentId = "btn-go";
      const clickScene = await Scene.create({
        name: "Click",
        components: [
          {
            id: componentId,
            clickable: true,
            nextScene: scene2._id,
            type: "BUTTON",
          },
        ],
        roles: [],
        time: 60,
      });
      await Scene.findByIdAndUpdate(scene2._id, { time: 90 });

      const enteredAt = new Date(Date.now() - 45_000);
      await User.findOneAndUpdate(
        { uid: "uid-player" },
        {
          $set: {
            [`paths.${scenarioId()}`]: [clickScene._id.toString()],
            [`sceneEnteredAt.${scenarioId()}`]: enteredAt,
          },
        }
      );

      const response = await axios.post(
        `http://localhost:${ctx.port}/api/navigate/user/${scenario._id}`,
        {
          uid: "uid-player",
          currentScene: clickScene._id.toString(),
          componentId,
        },
        authHeaders("uid-player")
      );
      expect(response.status).toBe(200);
      expect(response.data.active).toBe(scene2._id.toString());
      // New scene → full duration, and the stamp is refreshed.
      expect(response.data.remainingTime).toBe(90);

      const dbUser = await User.findOne({ uid: "uid-player" });
      expect(dbUser.sceneEnteredAt.get(scenarioId()).getTime()).toBeGreaterThan(
        enteredAt.getTime()
      );
    });

    it("clears the entry stamp on reset", async () => {
      const resetScene = await Scene.create({
        name: "Reset Timed",
        components: [{ type: "RESET_BUTTON" }],
        roles: [],
        time: 60,
      });
      await User.findOneAndUpdate(
        { uid: "uid-player" },
        {
          $set: {
            [`paths.${scenarioId()}`]: [resetScene._id.toString()],
            [`sceneEnteredAt.${scenarioId()}`]: new Date(),
          },
        }
      );

      await axios.post(
        `http://localhost:${ctx.port}/api/navigate/user/reset/${scenario._id}`,
        { uid: "uid-player", currentScene: resetScene._id.toString() },
        authHeaders("uid-player")
      );

      const dbUser = await User.findOne({ uid: "uid-player" });
      expect(dbUser.sceneEnteredAt.get(scenarioId())).toBeUndefined();
    });
  });
});
