import { jest, describe, beforeEach, it, expect } from "@jest/globals";

import express from "express";
import axios from "axios";
import routes from "../../index.js";
import Scenario from "../../../db/models/scenario.js";
import Scene from "../../../db/models/scene.js";
import Group from "../../../db/models/group.js";
import User from "../../../db/models/user.js";
import Note from "../../../db/models/note.js";
import Resource from "../../../db/models/resource.js";
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
    expect(response.data.stateVariables).toBeDefined();

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

  // --- GET /navigate/group/resources/:groupId ---

  it("GET /navigate/group/resources/:groupId returns resources visible to the group", async () => {
    // Resource with no required flags is always visible
    await Resource.create({
      name: "Open Resource",
      type: "text",
      scenarioId: scenario._id.toString(),
      textContent: "content",
      imageContent: "",
      requiredFlags: [],
    });

    const response = await axios.get(
      `http://localhost:${ctx.port}/api/navigate/group/resources/${group._id}`,
      authHeaders("uid-player")
    );
    expect(response.status).toBe(200);
    expect(response.data).toHaveLength(1);
    expect(response.data[0].name).toBe("Open Resource");
  });

  it("GET /navigate/group/resources/:groupId filters resources by required flags", async () => {
    await Resource.create({
      name: "Gated Resource",
      type: "text",
      scenarioId: scenario._id.toString(),
      textContent: "content",
      imageContent: "",
      requiredFlags: ["flag-unlocked"],
    });

    // group has no currentFlags → gated resource is not returned
    const response = await axios.get(
      `http://localhost:${ctx.port}/api/navigate/group/resources/${group._id}`,
      authHeaders("uid-player")
    );
    expect(response.status).toBe(200);
    expect(response.data).toHaveLength(0);
  });

  it("GET /navigate/group/resources/:groupId returns 404 for unknown group", async () => {
    await expect(
      axios.get(
        `http://localhost:${ctx.port}/api/navigate/group/resources/000000000000000000000099`,
        authHeaders("uid-player")
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
            nextScene: scene2._id,
            type: "BUTTON",
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
            nextScene: timedTarget._id,
            type: "BUTTON",
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
            nextScene: selfLoopScene._id,
            type: "BUTTON",
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
});
