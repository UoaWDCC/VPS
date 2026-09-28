import { jest, describe, beforeEach, it, expect } from "@jest/globals";

import express from "express";
import axios from "axios";
import routes from "../../index.js";
import Scenario from "../../../db/models/scenario.js";
import Scene from "../../../db/models/scene.js";
import Group from "../../../db/models/group.js";
import User from "../../../db/models/user.js";
import Note from "../../../db/models/note.js";
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

describe("Navigate Group API tests", () => {
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
  let user;
  let group;

  beforeEach(async () => {
    // scene1 links to scene2 via a clickable button component
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
      name: "Nav Scenario",
      uid: "uid-author",
      scenes: [scene1._id, scene2._id],
      stateVariables: [],
    });

    user = await User.create({
      uid: "uid-player",
      name: "Player",
      email: "player@auckland.ac.nz",
      pictureURL: "http://example.com/p.png",
    });

    group = await Group.create({
      users: [{ email: user.email, name: user.name, role: "doctor" }],
      notes: {},
      path: [],
      scenarioId: scenario._id.toString(),
      currentFlags: [],
      stateVariables: [],
      stateVersion: 0,
    });
  });

  // --- POST /navigate/group/:groupId (first navigation) ---

  it("POST /navigate/group/:groupId initiates navigation when group path is empty", async () => {
    const response = await axios.post(
      `http://localhost:${ctx.port}/api/navigate/group/${group._id}`,
      { uid: "uid-player", addFlags: [], removeFlags: [] },
      authHeaders("uid-player")
    );
    expect(response.status).toBe(200);
    // Returns the active scene and connected scenes
    expect(response.data.active).toBe(scene1._id.toString());
    expect(response.data.properties).toBeDefined();

    // Group path should now contain scene1
    const dbGroup = await Group.findById(group._id);
    expect(dbGroup.path[0]).toBe(scene1._id.toString());
  });

  it("POST /navigate/group/:groupId resumes at current path head on re-entry", async () => {
    // Set group path so it already has scene1
    await Group.findByIdAndUpdate(group._id, { path: [scene1._id.toString()] });

    const response = await axios.post(
      `http://localhost:${ctx.port}/api/navigate/group/${group._id}`,
      { uid: "uid-player", addFlags: [], removeFlags: [] }, // no currentScene → session re-entry
      authHeaders("uid-player")
    );
    expect(response.status).toBe(200);
    expect(response.data.active).toBe(scene1._id.toString());
  });

  it("POST /navigate/group/:groupId returns 404 for unknown group", async () => {
    await expect(
      axios.post(
        `http://localhost:${ctx.port}/api/navigate/group/000000000000000000000099`,
        { uid: "uid-player", addFlags: [], removeFlags: [] },
        authHeaders("uid-player")
      )
    ).rejects.toMatchObject({ response: { status: 404 } });
  });

  it("POST /navigate/group/:groupId allows access when role casing differs (case-insensitive match)", async () => {
    // scene1 is gated to "doctor" (lowercase), but the group member's role
    // was uploaded as "Doctor" (capitalised) - access should still be granted
    await Scene.findByIdAndUpdate(scene1._id, { roles: ["doctor"] });
    await Group.findByIdAndUpdate(group._id, {
      users: [{ email: user.email, name: user.name, role: "Doctor" }],
    });

    const response = await axios.post(
      `http://localhost:${ctx.port}/api/navigate/group/${group._id}`,
      { uid: "uid-player", addFlags: [], removeFlags: [] },
      authHeaders("uid-player")
    );
    expect(response.status).toBe(200);
    expect(response.data.active).toBe(scene1._id.toString());
  });

  it("POST /navigate/group/:groupId allows access when role has stray whitespace (trim-insensitive match)", async () => {
    // scene1 is gated to "doctor", but the group member's role has stray
    // whitespace from an untrimmed CSV cell - access should still be granted
    await Scene.findByIdAndUpdate(scene1._id, { roles: ["doctor"] });
    await Group.findByIdAndUpdate(group._id, {
      users: [{ email: user.email, name: user.name, role: " doctor " }],
    });

    const response = await axios.post(
      `http://localhost:${ctx.port}/api/navigate/group/${group._id}`,
      { uid: "uid-player", addFlags: [], removeFlags: [] },
      authHeaders("uid-player")
    );
    expect(response.status).toBe(200);
    expect(response.data.active).toBe(scene1._id.toString());
  });

  it("POST /navigate/group/:groupId returns 403 when the group member's role has no access", async () => {
    await Scene.findByIdAndUpdate(scene1._id, { roles: ["nurse"] });
    await Group.findByIdAndUpdate(group._id, {
      users: [{ email: user.email, name: user.name, role: "doctor" }],
    });

    await expect(
      axios.post(
        `http://localhost:${ctx.port}/api/navigate/group/${group._id}`,
        { uid: "uid-player", addFlags: [], removeFlags: [] },
        authHeaders("uid-player")
      )
    ).rejects.toMatchObject({ response: { status: 403 } });
  });

  it("POST /navigate/group/:groupId returns 404 when user exists but is not in the group", async () => {
    // Create a user that is NOT a member of the group
    await User.create({
      uid: "uid-stranger",
      name: "Stranger",
      email: "stranger@auckland.ac.nz",
      pictureURL: "http://example.com/s.png",
    });

    await expect(
      axios.post(
        `http://localhost:${ctx.port}/api/navigate/group/${group._id}`,
        { uid: "uid-stranger", addFlags: [], removeFlags: [] },
        authHeaders("uid-stranger")
      )
    ).rejects.toMatchObject({ response: { status: 404 } });
  });

  // --- POST /navigate/group/reset/:groupId ---

  it("POST /navigate/group/reset/:groupId resets the group path when a RESET_BUTTON is present", async () => {
    const resetScene = await Scene.create({
      name: "Reset Scene",
      components: [{ type: "RESET_BUTTON" }],
      roles: [],
    });

    await Group.findByIdAndUpdate(group._id, {
      path: [resetScene._id.toString()],
    });

    const response = await axios.post(
      `http://localhost:${ctx.port}/api/navigate/group/reset/${group._id}`,
      { uid: "uid-player", currentScene: resetScene._id.toString() },
      authHeaders("uid-player")
    );
    expect(response.status).toBe(200);

    const dbGroup = await Group.findById(group._id);
    expect(dbGroup.path).toHaveLength(0);
    expect(dbGroup.currentFlags).toHaveLength(0);
  });

  it("POST /navigate/group/reset/:groupId returns 403 when scene has no RESET_BUTTON", async () => {
    await Group.findByIdAndUpdate(group._id, {
      path: [scene1._id.toString()],
    });

    // scene1 has no RESET_BUTTON component
    await expect(
      axios.post(
        `http://localhost:${ctx.port}/api/navigate/group/reset/${group._id}`,
        {
          uid: "uid-player",
          currentScene: scene1._id.toString(),
          addFlags: [],
          removeFlags: [],
        },
        authHeaders("uid-player")
      )
    ).rejects.toMatchObject({ response: { status: 403 } });
  });

  it("POST /navigate/group/reset/:groupId deletes all notes for the group on reset", async () => {
    const resetScene = await Scene.create({
      name: "Reset Scene With Notes",
      components: [{ type: "RESET_BUTTON" }],
      roles: [],
    });

    const note = await Note.create({
      title: "A note",
      text: "content",
      role: "doctor",
    });

    await Group.findByIdAndUpdate(group._id, {
      path: [resetScene._id.toString()],
      notes: { doctor: [note._id.toString()] },
    });

    await axios.post(
      `http://localhost:${ctx.port}/api/navigate/group/reset/${group._id}`,
      { uid: "uid-player", currentScene: resetScene._id.toString() },
      authHeaders("uid-player")
    );

    const dbNote = await Note.findById(note._id);
    expect(dbNote).toBeNull();
  });

  // --- Server-authoritative scene timer ---

  describe("scene timer", () => {
    it("returns the full remainingTime and stamps entry on first navigation", async () => {
      await Scene.findByIdAndUpdate(scene1._id, { time: 120 });

      const response = await axios.post(
        `http://localhost:${ctx.port}/api/navigate/group/${group._id}`,
        { uid: "uid-player", addFlags: [], removeFlags: [] },
        authHeaders("uid-player")
      );
      expect(response.status).toBe(200);
      expect(response.data.remainingTime).toBe(120);

      const dbGroup = await Group.findById(group._id);
      expect(dbGroup.currentSceneEnteredAt).toBeInstanceOf(Date);
    });

    it("resumes with a decreased remainingTime on re-entry (refresh cannot reset it)", async () => {
      const timedScene = await Scene.create({
        name: "Timed",
        components: [],
        roles: [],
        time: 120,
      });
      const enteredAt = new Date(Date.now() - 30_000);
      await Group.findByIdAndUpdate(group._id, {
        path: [timedScene._id.toString()],
        currentSceneEnteredAt: enteredAt,
      });

      const response = await axios.post(
        `http://localhost:${ctx.port}/api/navigate/group/${group._id}`,
        { uid: "uid-player", addFlags: [], removeFlags: [] }, // no currentScene → refresh
        authHeaders("uid-player")
      );
      expect(response.status).toBe(200);
      expect(response.data.remainingTime).toBeGreaterThan(85);
      expect(response.data.remainingTime).toBeLessThanOrEqual(91);

      const dbGroup = await Group.findById(group._id);
      expect(dbGroup.currentSceneEnteredAt.getTime()).toBe(enteredAt.getTime());
    });

    it("resets remainingTime to full and restamps on a real scene move", async () => {
      const componentId = "btn-go";
      const clickScene = await Scene.create({
        name: "Click",
        components: [
          {
            id: componentId,
            clickable: true,
            actionRefs: [{ index: 0, id: "action-go" }],
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
            index: 0,
          },
        ],
        roles: [],
        time: 60,
      });
      await Scene.findByIdAndUpdate(scene2._id, { time: 90 });

      const enteredAt = new Date(Date.now() - 45_000);
      await Group.findByIdAndUpdate(group._id, {
        path: [clickScene._id.toString()],
        currentSceneEnteredAt: enteredAt,
      });

      const response = await axios.post(
        `http://localhost:${ctx.port}/api/navigate/group/${group._id}`,
        {
          uid: "uid-player",
          currentScene: clickScene._id.toString(),
          trigger: "click",
          componentId,
          addFlags: [],
          removeFlags: [],
        },
        authHeaders("uid-player")
      );
      expect(response.status).toBe(200);
      expect(response.data.active).toBe(scene2._id.toString());
      expect(response.data.remainingTime).toBe(90);

      const dbGroup = await Group.findById(group._id);
      expect(dbGroup.currentSceneEnteredAt.getTime()).toBeGreaterThan(
        enteredAt.getTime()
      );
    });

    it("includes `time` on connected (not-yet-entered) scenes, not just the active one", async () => {
      const componentId = "btn-go";
      const timedTarget = await Scene.create({
        name: "Timed Target",
        components: [],
        roles: [],
        time: 75,
      });
      const linkingScene = await Scene.create({
        name: "Linking",
        components: [
          {
            id: componentId,
            clickable: true,
            actionRefs: [{ index: 0, id: "action-go" }],
            type: "BUTTON",
          },
        ],
        actions: [
          {
            id: "action-go",
            name: "Go",
            linkedScene: timedTarget._id,
            conditions: [],
            operations: [],
            index: 0,
          },
        ],
        roles: [],
      });
      await Group.findByIdAndUpdate(group._id, {
        path: [linkingScene._id.toString()],
      });

      const response = await axios.post(
        `http://localhost:${ctx.port}/api/navigate/group/${group._id}`,
        { uid: "uid-player", addFlags: [], removeFlags: [] }, // no currentScene → refresh
        authHeaders("uid-player")
      );
      expect(response.status).toBe(200);
      // linkingScene has no timer, so this is a refresh-style response whose
      // `scenes` still includes the connected (not-yet-active) timed target.
      const connected = response.data.scenes.find(
        (s) => s._id === timedTarget._id.toString()
      );
      expect(connected.time).toBe(75);
    });

    it("returns the configured remainingTime for a scene that links back to itself", async () => {
      const componentId = "btn-retry";
      const selfLoopScene = await Scene.create({
        name: "Self Loop",
        components: [],
        roles: [],
        time: 45,
      });
      await Scene.findByIdAndUpdate(selfLoopScene._id, {
        components: [
          {
            id: componentId,
            clickable: true,
            actionRefs: [{ index: 0, id: "action-retry" }],
            type: "BUTTON",
          },
        ],
        actions: [
          {
            id: "action-retry",
            name: "Retry",
            linkedScene: selfLoopScene._id,
            conditions: [],
            operations: [],
            index: 0,
          },
        ],
      });
      await Group.findByIdAndUpdate(group._id, {
        path: [selfLoopScene._id.toString()],
      });

      const response = await axios.post(
        `http://localhost:${ctx.port}/api/navigate/group/${group._id}`,
        { uid: "uid-player", addFlags: [], removeFlags: [] }, // no currentScene → refresh
        authHeaders("uid-player")
      );
      expect(response.status).toBe(200);
      expect(response.data.remainingTime).toBe(45);
    });

    it("clears the entry stamp on reset", async () => {
      const resetScene = await Scene.create({
        name: "Reset Timed",
        components: [{ type: "RESET_BUTTON" }],
        roles: [],
        time: 60,
      });
      await Group.findByIdAndUpdate(group._id, {
        path: [resetScene._id.toString()],
        currentSceneEnteredAt: new Date(),
      });

      await axios.post(
        `http://localhost:${ctx.port}/api/navigate/group/reset/${group._id}`,
        { uid: "uid-player", currentScene: resetScene._id.toString() },
        authHeaders("uid-player")
      );

      const dbGroup = await Group.findById(group._id);
      expect(dbGroup.currentSceneEnteredAt).toBeNull();
    });
  });

  // --- Trigger-based action resolution ---

  describe("trigger-based action resolution", () => {
    const setHp = (value) =>
      Group.findByIdAndUpdate(group._id, {
        stateVariables: [{ id: "hp", type: "number", value }],
        stateVersion: 0,
      });

    it("returns 400 when trigger is missing on a move-step request", async () => {
      await Group.findByIdAndUpdate(group._id, {
        path: [scene1._id.toString()],
      });

      await expect(
        axios.post(
          `http://localhost:${ctx.port}/api/navigate/group/${group._id}`,
          {
            uid: "uid-player",
            currentScene: scene1._id.toString(),
            addFlags: [],
            removeFlags: [],
          },
          authHeaders("uid-player")
        )
      ).rejects.toMatchObject({ response: { status: 400 } });
    });

    it("returns 400 for an invalid trigger value", async () => {
      await Group.findByIdAndUpdate(group._id, {
        path: [scene1._id.toString()],
      });

      await expect(
        axios.post(
          `http://localhost:${ctx.port}/api/navigate/group/${group._id}`,
          {
            uid: "uid-player",
            currentScene: scene1._id.toString(),
            trigger: "bogus",
            addFlags: [],
            removeFlags: [],
          },
          authHeaders("uid-player")
        )
      ).rejects.toMatchObject({ response: { status: 400 } });
    });

    it("returns 400 when componentId is missing for a click trigger", async () => {
      await Group.findByIdAndUpdate(group._id, {
        path: [scene1._id.toString()],
      });

      await expect(
        axios.post(
          `http://localhost:${ctx.port}/api/navigate/group/${group._id}`,
          {
            uid: "uid-player",
            currentScene: scene1._id.toString(),
            trigger: "click",
            addFlags: [],
            removeFlags: [],
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
            index: 0,
          },
        ],
        defaultActionRefs: [{ index: 0, id: "action-default" }],
      });
      await Group.findByIdAndUpdate(group._id, {
        path: [defaultScene._id.toString()],
      });

      const response = await axios.post(
        `http://localhost:${ctx.port}/api/navigate/group/${group._id}`,
        {
          uid: "uid-player",
          currentScene: defaultScene._id.toString(),
          trigger: "default",
          addFlags: [],
          removeFlags: [],
        },
        authHeaders("uid-player")
      );
      expect(response.status).toBe(200);
      expect(response.data.active).toBe(scene2._id.toString());
    });

    it("resolves a timer trigger via scene.timerActionRefs and navigates", async () => {
      const timerScene = await Scene.create({
        name: "Timer Trigger Scene",
        components: [],
        roles: [],
        actions: [
          {
            id: "action-timer",
            name: "Timeout",
            linkedScene: scene2._id,
            conditions: [],
            operations: [],
            index: 0,
          },
        ],
        timerActionRefs: [{ index: 0, id: "action-timer" }],
      });
      await Group.findByIdAndUpdate(group._id, {
        path: [timerScene._id.toString()],
      });

      const response = await axios.post(
        `http://localhost:${ctx.port}/api/navigate/group/${group._id}`,
        {
          uid: "uid-player",
          currentScene: timerScene._id.toString(),
          trigger: "timer",
          addFlags: [],
          removeFlags: [],
        },
        authHeaders("uid-player")
      );
      expect(response.status).toBe(200);
      expect(response.data.active).toBe(scene2._id.toString());
    });

    it("does not navigate when the action's conditions fail", async () => {
      await setHp(5);
      const gatedScene = await Scene.create({
        name: "Gated Scene",
        components: [],
        roles: [],
        actions: [
          {
            id: "action-gated",
            name: "Advance if healthy",
            linkedScene: scene2._id,
            conditions: [
              { id: "c1", stateVariableId: "hp", comparator: ">", value: 10 },
            ],
            operations: [],
            index: 0,
          },
        ],
        defaultActionRefs: [{ index: 0, id: "action-gated" }],
      });
      await Group.findByIdAndUpdate(group._id, {
        path: [gatedScene._id.toString()],
      });

      const response = await axios.post(
        `http://localhost:${ctx.port}/api/navigate/group/${group._id}`,
        {
          uid: "uid-player",
          currentScene: gatedScene._id.toString(),
          trigger: "default",
          addFlags: [],
          removeFlags: [],
        },
        authHeaders("uid-player")
      );
      expect(response.status).toBe(200);
      // Condition failed, so no move happened — `active`/`scenes` are only
      // populated on an actual move.
      expect(response.data.active).toBeUndefined();

      const dbGroup = await Group.findById(group._id);
      expect(dbGroup.path[0]).toBe(gatedScene._id.toString());
    });

    it("navigates when the action's conditions pass", async () => {
      await setHp(20);
      const gatedScene = await Scene.create({
        name: "Gated Scene Pass",
        components: [],
        roles: [],
        actions: [
          {
            id: "action-gated",
            name: "Advance if healthy",
            linkedScene: scene2._id,
            conditions: [
              { id: "c1", stateVariableId: "hp", comparator: ">", value: 10 },
            ],
            operations: [],
            index: 0,
          },
        ],
        defaultActionRefs: [{ index: 0, id: "action-gated" }],
      });
      await Group.findByIdAndUpdate(group._id, {
        path: [gatedScene._id.toString()],
      });

      const response = await axios.post(
        `http://localhost:${ctx.port}/api/navigate/group/${group._id}`,
        {
          uid: "uid-player",
          currentScene: gatedScene._id.toString(),
          trigger: "default",
          addFlags: [],
          removeFlags: [],
        },
        authHeaders("uid-player")
      );
      expect(response.status).toBe(200);
      expect(response.data.active).toBe(scene2._id.toString());
    });

    it("persists staged property operations without navigating when the action has no linkedScene", async () => {
      await setHp(5);
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
            index: 0,
          },
        ],
        defaultActionRefs: [{ index: 0, id: "action-heal" }],
      });
      await Group.findByIdAndUpdate(group._id, {
        path: [mutatingScene._id.toString()],
      });

      const response = await axios.post(
        `http://localhost:${ctx.port}/api/navigate/group/${group._id}`,
        {
          uid: "uid-player",
          currentScene: mutatingScene._id.toString(),
          trigger: "default",
          addFlags: [],
          removeFlags: [],
        },
        authHeaders("uid-player")
      );
      expect(response.status).toBe(200);
      expect(response.data.properties.find((p) => p.id === "hp").value).toBe(
        10
      );
      expect(response.data.propertyVersion).toBe(1);

      const dbGroup = await Group.findById(group._id);
      expect(dbGroup.path[0]).toBe(mutatingScene._id.toString());
    });
  });

  // --- Direct scene links (defaultLinkedScene / timerLinkedScene) ---

  describe("direct scene links", () => {
    const startAt = (scene, stateVariables = []) =>
      Group.findByIdAndUpdate(group._id, {
        path: [scene._id.toString()],
        stateVariables,
        stateVersion: 0,
      });

    const navigate = (currentScene, body) =>
      axios.post(
        `http://localhost:${ctx.port}/api/navigate/group/${group._id}`,
        {
          uid: "uid-player",
          currentScene: currentScene._id.toString(),
          addFlags: [],
          removeFlags: [],
          ...body,
        },
        authHeaders("uid-player")
      );

    const pathHead = async () => (await Group.findById(group._id)).path[0];

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
            index: 0,
          },
        ],
        defaultActionRefs: [{ index: 0, id: "action-go" }],
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
            index: 0,
          },
          {
            id: "action-heal",
            name: "Heal",
            linkedScene: null,
            conditions: [],
            operations: [
              { id: "op1", stateVariableId: "hp", operation: "add", value: 5 },
            ],
            index: 1,
          },
        ],
        defaultActionRefs: [
          { index: 0, id: "action-gated" },
          { index: 1, id: "action-heal" },
        ],
        defaultLinkedScene: scene2._id,
      });
      await startAt(linkScene, [{ id: "hp", type: "number", value: 5 }]);

      const response = await navigate(linkScene, { trigger: "default" });
      expect(response.data.active).toBe(scene2._id.toString());
      expect(response.data.properties.find((p) => p.id === "hp").value).toBe(
        10
      );
      expect(response.data.propertyVersion).toBe(1);
      expect(await pathHead()).toBe(scene2._id.toString());
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

      const dbGroup = await Group.findById(group._id);
      expect(dbGroup.path).toEqual([selfScene._id.toString()]);
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
        `http://localhost:${ctx.port}/api/navigate/group/${group._id}`,
        { uid: "uid-player", addFlags: [], removeFlags: [] },
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
