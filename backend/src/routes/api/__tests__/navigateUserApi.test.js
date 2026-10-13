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
          actionRefs: [
            { id: "ref-action-go", actionId: "action-go", index: "a0" },
          ],
          type: "BUTTON",
        },
      ],
      actions: [
        {
          id: "action-go",
          name: "Go",
          linkedScene: scene2._id,
          conditions: [],
          operations: [],
        },
      ],
      roles: [],
    });

    await User.findOneAndUpdate(
      { uid: "uid-player" },
      { $set: { [`paths.${scenario._id}`]: [clickScene._id.toString()] } }
    );

    const response = await axios.post(
      `http://localhost:${ctx.port}/api/navigate/user/${scenario._id}`,
      {
        uid: "uid-player",
        currentScene: clickScene._id.toString(),
        trigger: "click",
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

  it("POST /navigate/user/:scenarioId returns 400 when trigger is missing on a move-step request", async () => {
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
        },
        authHeaders("uid-player")
      )
    ).rejects.toMatchObject({ response: { status: 400 } });
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
            actionRefs: [
              { id: "ref-action-go", actionId: "action-go", index: "a0" },
            ],
            type: "BUTTON",
          },
        ],
        actions: [
          {
            id: "action-go",
            name: "Go",
            linkedScene: scene2._id,
            conditions: [],
            operations: [],
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
          trigger: "click",
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

  // --- Trigger-based action resolution ---

  describe("timer fires once per scene entry", () => {
    let timedScene;

    beforeEach(async () => {
      timedScene = await Scene.create({
        name: "Timed Heal",
        components: [],
        roles: [],
        time: 30,
        actions: [
          {
            id: "action-heal",
            name: "Heal",
            linkedScene: null,
            conditions: [],
            operations: [
              { id: "op1", stateVariableId: "hp", operation: "add", value: 5 },
            ],
          },
        ],
        timerActionRefs: [
          { id: "ref-action-heal", actionId: "action-heal", index: "a0" },
        ],
        defaultLinkedScene: scene2._id,
      });
      await Scenario.findByIdAndUpdate(scenario._id, {
        scenes: [scene1._id, scene2._id, timedScene._id],
      });
      const scenarioId = scenario._id.toString();
      await User.findOneAndUpdate(
        { uid: "uid-player" },
        {
          $set: {
            [`paths.${scenarioId}`]: [timedScene._id.toString()],
            [`stateVariables.${scenarioId}`]: [
              { id: "hp", type: "number", value: 5 },
            ],
            [`stateVersions.${scenarioId}`]: 0,
          },
        }
      );
    });

    const navigate = (trigger) =>
      axios.post(
        `http://localhost:${ctx.port}/api/navigate/user/${scenario._id}`,
        {
          uid: "uid-player",
          currentScene: timedScene._id.toString(),
          trigger,
        },
        authHeaders("uid-player")
      );

    const dbUser = () => User.findOne({ uid: "uid-player" });

    it("ignores a repeated timer trigger for the same scene entry", async () => {
      await navigate("timer");

      const second = await navigate("timer");
      expect(second.status).toBe(200);
      expect(second.data.active).toBeUndefined();
      expect(second.data.propertyVersion).toBe(1);

      const user = await dbUser();
      const hp = user.stateVariables
        .get(scenario._id.toString())
        .find((p) => p.id === "hp");
      expect(hp.value).toBe(10);
    });

    it("re-arms the timer on the next scene entry", async () => {
      await navigate("timer");
      await navigate("default");

      const user = await dbUser();
      const scenarioId = scenario._id.toString();
      expect(user.paths.get(scenarioId)[0]).toBe(scene2._id.toString());
      expect(user.sceneTimerFired.get(scenarioId)).toBe(false);
    });

    it("re-arms the timer on reset", async () => {
      await Scene.findByIdAndUpdate(timedScene._id, {
        components: [{ type: "RESET_BUTTON" }],
      });
      await navigate("timer");

      await axios.post(
        `http://localhost:${ctx.port}/api/navigate/user/reset/${scenario._id}`,
        { uid: "uid-player", currentScene: timedScene._id.toString() },
        authHeaders("uid-player")
      );

      const user = await dbUser();
      expect(user.sceneTimerFired.get(scenario._id.toString())).toBeUndefined();
    });
  });

  describe("trigger-based action resolution", () => {
    const scenarioId = () => scenario._id.toString();

    it("returns 400 for an invalid trigger value", async () => {
      await User.findOneAndUpdate(
        { uid: "uid-player" },
        { $set: { [`paths.${scenarioId()}`]: [scene1._id.toString()] } }
      );

      await expect(
        axios.post(
          `http://localhost:${ctx.port}/api/navigate/user/${scenario._id}`,
          {
            uid: "uid-player",
            currentScene: scene1._id.toString(),
            trigger: "bogus",
          },
          authHeaders("uid-player")
        )
      ).rejects.toMatchObject({ response: { status: 400 } });
    });

    it("returns 400 when componentId is missing for a click trigger", async () => {
      await User.findOneAndUpdate(
        { uid: "uid-player" },
        { $set: { [`paths.${scenarioId()}`]: [scene1._id.toString()] } }
      );

      await expect(
        axios.post(
          `http://localhost:${ctx.port}/api/navigate/user/${scenario._id}`,
          {
            uid: "uid-player",
            currentScene: scene1._id.toString(),
            trigger: "click",
          },
          authHeaders("uid-player")
        )
      ).rejects.toMatchObject({ response: { status: 400 } });
    });

    it("resolves a default trigger via scene.defaultActionRefs and navigates", async () => {
      const defaultScene = await Scene.create({
        name: "Default Trigger Scene",
        components: [],
        roles: [],
        actions: [
          {
            id: "action-default",
            name: "Advance",
            linkedScene: scene2._id,
            conditions: [],
            operations: [],
          },
        ],
        defaultActionRefs: [
          { id: "ref-action-default", actionId: "action-default", index: "a0" },
        ],
      });
      await User.findOneAndUpdate(
        { uid: "uid-player" },
        { $set: { [`paths.${scenarioId()}`]: [defaultScene._id.toString()] } }
      );

      const response = await axios.post(
        `http://localhost:${ctx.port}/api/navigate/user/${scenario._id}`,
        {
          uid: "uid-player",
          currentScene: defaultScene._id.toString(),
          trigger: "default",
        },
        authHeaders("uid-player")
      );
      expect(response.status).toBe(200);
      expect(response.data.active).toBe(scene2._id.toString());
    });

    it("persists staged property operations without navigating when the action has no linkedScene", async () => {
      const mutatingScene = await Scene.create({
        name: "Mutating Scene",
        components: [],
        roles: [],
        actions: [
          {
            id: "action-heal",
            name: "Heal",
            linkedScene: null,
            conditions: [],
            operations: [
              { id: "op1", stateVariableId: "hp", operation: "add", value: 5 },
            ],
          },
        ],
        defaultActionRefs: [
          { id: "ref-action-heal", actionId: "action-heal", index: "a0" },
        ],
      });
      await User.findOneAndUpdate(
        { uid: "uid-player" },
        {
          $set: {
            [`paths.${scenarioId()}`]: [mutatingScene._id.toString()],
            [`stateVariables.${scenarioId()}`]: [
              { id: "hp", type: "number", value: 5 },
            ],
            [`stateVersions.${scenarioId()}`]: 0,
          },
        }
      );

      const response = await axios.post(
        `http://localhost:${ctx.port}/api/navigate/user/${scenario._id}`,
        {
          uid: "uid-player",
          currentScene: mutatingScene._id.toString(),
          trigger: "default",
        },
        authHeaders("uid-player")
      );
      expect(response.status).toBe(200);
      expect(response.data.properties.find((p) => p.id === "hp").value).toBe(
        10
      );
      expect(response.data.propertyVersion).toBe(1);

      const dbUser = await User.findOne({ uid: "uid-player" });
      expect(dbUser.paths.get(scenarioId())[0]).toBe(
        mutatingScene._id.toString()
      );
    });

    it("ignores stale conditions and operations instead of failing the trigger", async () => {
      const staleScene = await Scene.create({
        name: "Stale Scene",
        components: [],
        roles: [],
        actions: [
          {
            id: "action-stale",
            name: "Stale",
            linkedScene: scene2._id,
            // "hp" changed from number to boolean after these were authored
            conditions: [
              { id: "c1", stateVariableId: "hp", comparator: ">", value: 5 },
              {
                id: "c2",
                stateVariableId: "deleted-prop",
                comparator: "=",
                value: 1,
              },
            ],
            operations: [
              { id: "op1", stateVariableId: "hp", operation: "add", value: 5 },
              { id: "op2", stateVariableId: "hp", operation: "set", value: 5 },
            ],
          },
        ],
        defaultActionRefs: [
          { id: "ref-action-stale", actionId: "action-stale", index: "a0" },
        ],
      });
      await User.findOneAndUpdate(
        { uid: "uid-player" },
        {
          $set: {
            [`paths.${scenarioId()}`]: [staleScene._id.toString()],
            [`stateVariables.${scenarioId()}`]: [
              { id: "hp", type: "boolean", value: false },
            ],
            [`stateVersions.${scenarioId()}`]: 0,
          },
        }
      );

      const response = await axios.post(
        `http://localhost:${ctx.port}/api/navigate/user/${scenario._id}`,
        {
          uid: "uid-player",
          currentScene: staleScene._id.toString(),
          trigger: "default",
        },
        authHeaders("uid-player")
      );
      expect(response.status).toBe(200);
      expect(response.data.active).toBe(scene2._id.toString());
      expect(response.data.properties.find((p) => p.id === "hp").value).toBe(
        false
      );
    });
  });

  // --- Direct scene links (defaultLinkedScene / timerLinkedScene) ---

  describe("direct scene links", () => {
    const scenarioId = () => scenario._id.toString();

    const startAt = (scene, stateVariables = []) =>
      User.findOneAndUpdate(
        { uid: "uid-player" },
        {
          $set: {
            [`paths.${scenarioId()}`]: [scene._id.toString()],
            [`stateVariables.${scenarioId()}`]: stateVariables,
            [`stateVersions.${scenarioId()}`]: 0,
          },
        }
      );

    const navigate = (currentScene, body) =>
      axios.post(
        `http://localhost:${ctx.port}/api/navigate/user/${scenario._id}`,
        {
          uid: "uid-player",
          currentScene: currentScene._id.toString(),
          ...body,
        },
        authHeaders("uid-player")
      );

    const pathHead = async () => {
      const dbUser = await User.findOne({ uid: "uid-player" });
      return dbUser.paths.get(scenarioId())[0];
    };

    it("follows defaultLinkedScene on a default trigger with no actions", async () => {
      const linkScene = await Scene.create({
        name: "Default Link",
        components: [],
        roles: [],
        defaultLinkedScene: scene2._id,
      });
      await startAt(linkScene);

      const response = await navigate(linkScene, { trigger: "default" });
      expect(response.status).toBe(200);
      expect(response.data.active).toBe(scene2._id.toString());
      expect(await pathHead()).toBe(scene2._id.toString());
    });

    it("follows timerLinkedScene on a timer trigger with no actions", async () => {
      const linkScene = await Scene.create({
        name: "Timer Link",
        components: [],
        roles: [],
        time: 30,
        timerLinkedScene: scene2._id,
      });
      await startAt(linkScene);

      const response = await navigate(linkScene, { trigger: "timer" });
      expect(response.status).toBe(200);
      expect(response.data.active).toBe(scene2._id.toString());
      expect(await pathHead()).toBe(scene2._id.toString());
    });

    it("does not cross triggers (timer trigger ignores defaultLinkedScene)", async () => {
      const linkScene = await Scene.create({
        name: "Default Only",
        components: [],
        roles: [],
        defaultLinkedScene: scene2._id,
      });
      await startAt(linkScene);

      const response = await navigate(linkScene, { trigger: "timer" });
      expect(response.status).toBe(200);
      expect(response.data.active).toBeUndefined();
      expect(await pathHead()).toBe(linkScene._id.toString());
    });

    it("follows the component's linkedScene on a click with no linking action", async () => {
      const linkScene = await Scene.create({
        name: "Click Link",
        components: [
          {
            id: "btn",
            clickable: true,
            actionRefs: [],
            linkedScene: scene2._id.toString(),
            type: "BUTTON",
          },
        ],
        roles: [],
        defaultLinkedScene: scene1._id,
      });
      await startAt(linkScene);

      const response = await navigate(linkScene, {
        trigger: "click",
        componentId: "btn",
      });
      expect(response.status).toBe(200);
      expect(response.data.active).toBe(scene2._id.toString());
      expect(await pathHead()).toBe(scene2._id.toString());
    });

    it("ignores a component's linkedScene to a scene no longer in the scenario", async () => {
      const deletedScene = await Scene.create({
        name: "Deleted",
        components: [],
        roles: [],
      });
      const linkScene = await Scene.create({
        name: "Stale Link",
        components: [
          {
            id: "btn",
            clickable: true,
            actionRefs: [],
            linkedScene: deletedScene._id.toString(),
            type: "BUTTON",
          },
        ],
        roles: [],
      });
      await startAt(linkScene);

      const response = await navigate(linkScene, {
        trigger: "click",
        componentId: "btn",
      });
      expect(response.status).toBe(200);
      expect(response.data.active).toBeUndefined();
      expect(await pathHead()).toBe(linkScene._id.toString());
    });

    it("does not follow defaultLinkedScene on a click trigger", async () => {
      const linkScene = await Scene.create({
        name: "Click Without Link",
        components: [
          { id: "btn", clickable: true, actionRefs: [], type: "BUTTON" },
        ],
        roles: [],
        defaultLinkedScene: scene2._id,
      });
      await startAt(linkScene);

      const response = await navigate(linkScene, {
        trigger: "click",
        componentId: "btn",
      });
      expect(response.status).toBe(200);
      expect(response.data.active).toBeUndefined();
      expect(await pathHead()).toBe(linkScene._id.toString());
    });

    it("prefers an action's linkedScene over the direct link", async () => {
      const linkScene = await Scene.create({
        name: "Action Wins",
        components: [],
        roles: [],
        actions: [
          {
            id: "action-go",
            name: "Go",
            linkedScene: scene1._id,
            conditions: [],
            operations: [],
          },
        ],
        defaultActionRefs: [
          { id: "ref-action-go", actionId: "action-go", index: "a0" },
        ],
        defaultLinkedScene: scene2._id,
      });
      await startAt(linkScene);

      const response = await navigate(linkScene, { trigger: "default" });
      expect(response.data.active).toBe(scene1._id.toString());
      expect(await pathHead()).toBe(scene1._id.toString());
    });

    it("falls through to the direct link when no action links, keeping staged operations", async () => {
      const linkScene = await Scene.create({
        name: "Fallthrough",
        components: [],
        roles: [],
        actions: [
          {
            id: "action-gated",
            name: "Gated",
            linkedScene: scene1._id,
            conditions: [
              { id: "c1", stateVariableId: "hp", comparator: ">", value: 100 },
            ],
            operations: [],
          },
          {
            id: "action-heal",
            name: "Heal",
            linkedScene: null,
            conditions: [],
            operations: [
              { id: "op1", stateVariableId: "hp", operation: "add", value: 5 },
            ],
          },
        ],
        defaultActionRefs: [
          { id: "ref-action-gated", actionId: "action-gated", index: "a0" },
          { id: "ref-action-heal", actionId: "action-heal", index: "a1" },
        ],
        defaultLinkedScene: scene2._id,
      });
      await startAt(linkScene, [{ id: "hp", type: "number", value: 5 }]);

      const response = await navigate(linkScene, { trigger: "default" });
      expect(response.data.active).toBe(scene2._id.toString());
      expect(response.data.properties.find((p) => p.id === "hp").value).toBe(
        10
      );
      expect(await pathHead()).toBe(scene2._id.toString());
    });

    it("skips an action's link to a scene no longer in the scenario, keeping its operations", async () => {
      const deletedScene = await Scene.create({
        name: "Deleted",
        components: [],
        roles: [],
      });
      const linkScene = await Scene.create({
        name: "Stale Action Link",
        components: [],
        roles: [],
        actions: [
          {
            id: "action-stale",
            name: "Stale",
            linkedScene: deletedScene._id,
            conditions: [],
            operations: [
              { id: "op1", stateVariableId: "hp", operation: "add", value: 5 },
            ],
          },
        ],
        defaultActionRefs: [
          { id: "ref-action-stale", actionId: "action-stale", index: "a0" },
        ],
        defaultLinkedScene: scene2._id,
      });
      await startAt(linkScene, [{ id: "hp", type: "number", value: 5 }]);

      const response = await navigate(linkScene, { trigger: "default" });
      expect(response.data.active).toBe(scene2._id.toString());
      expect(response.data.properties.find((p) => p.id === "hp").value).toBe(
        10
      );
      expect(await pathHead()).toBe(scene2._id.toString());
    });

    it("ignores a defaultLinkedScene to a scene no longer in the scenario", async () => {
      const deletedScene = await Scene.create({
        name: "Deleted",
        components: [],
        roles: [],
      });
      const linkScene = await Scene.create({
        name: "Stale Default Link",
        components: [],
        roles: [],
        defaultLinkedScene: deletedScene._id,
      });
      await startAt(linkScene);

      const response = await navigate(linkScene, { trigger: "default" });
      expect(response.status).toBe(200);
      expect(response.data.active).toBeUndefined();
      expect(await pathHead()).toBe(linkScene._id.toString());
    });

    it("does not push a path entry when the direct link points at the current scene", async () => {
      const selfScene = await Scene.create({
        name: "Self Link",
        components: [],
        roles: [],
      });
      await Scene.findByIdAndUpdate(selfScene._id, {
        defaultLinkedScene: selfScene._id,
      });
      await startAt(selfScene);

      const response = await navigate(selfScene, { trigger: "default" });
      expect(response.status).toBe(200);
      expect(response.data.active).toBeUndefined();

      const dbUser = await User.findOne({ uid: "uid-player" });
      expect(dbUser.paths.get(scenarioId())).toEqual([
        selfScene._id.toString(),
      ]);
    });

    it("preloads direct-link targets as connected scenes", async () => {
      const linkScene = await Scene.create({
        name: "Preload",
        components: [],
        roles: [],
        defaultLinkedScene: scene1._id,
        timerLinkedScene: scene2._id,
      });
      await Scenario.findByIdAndUpdate(scenario._id, {
        scenes: [linkScene._id, scene1._id, scene2._id],
      });

      const response = await axios.post(
        `http://localhost:${ctx.port}/api/navigate/user/${scenario._id}`,
        { uid: "uid-player" },
        authHeaders("uid-player")
      );
      expect(response.data.active).toBe(linkScene._id.toString());
      expect(response.data.scenes.map((s) => s._id)).toEqual(
        expect.arrayContaining([
          linkScene._id.toString(),
          scene1._id.toString(),
          scene2._id.toString(),
        ])
      );
    });
  });
});
