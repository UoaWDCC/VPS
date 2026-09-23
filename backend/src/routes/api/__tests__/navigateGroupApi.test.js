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
import { sendEmail } from "../../../util/resend.js";
import { EmailTemplate } from "../../../util/emailTemplates.js";
import { authHeaders } from "./testHelpers.js";
import {
  useMongoMemoryServer,
  useExpressServer,
} from "../../../test/testSetup.js";

jest.mock("../../../middleware/firebaseAuth");
jest.mock("firebase-admin");
jest.mock("../../../util/resend.js", () => ({
  sendEmail: jest.fn().mockResolvedValue({ id: "mock-email-id" }),
}));

auth.mockImplementation(async (req, res, next) => {
  req.body.uid = req.headers.authorization?.split(" ")[1];
  next();
});

// notifyNextRole is fire-and-forget (not awaited by the request handler), so
// the response can arrive before the mocked sendEmail call is recorded.
const waitForMockCall = async (mockFn, timeoutMs = 1000) => {
  const start = Date.now();
  while (mockFn.mock.calls.length === 0) {
    if (Date.now() - start > timeoutMs) return;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
};

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
    sendEmail.mockClear();

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

  // --- turn notification emails ---

  it("emails the teammate whose role the next scene belongs to on handoff", async () => {
    const componentId = "btn-finish";
    const nurseScene = await Scene.create({
      name: "Nurse Scene",
      components: [],
      roles: ["nurse"],
    });
    const doctorScene = await Scene.create({
      name: "Doctor Scene",
      components: [
        { id: componentId, clickable: true, nextScene: nurseScene._id },
      ],
      roles: ["doctor"],
    });

    await Group.findByIdAndUpdate(group._id, {
      users: [
        { email: user.email, name: user.name, role: "doctor" },
        {
          email: "nurse@auckland.ac.nz",
          name: "Nurse Nightingale",
          role: "nurse",
        },
      ],
      path: [doctorScene._id.toString()],
    });

    await expect(
      axios.post(
        `http://localhost:${ctx.port}/api/navigate/group/${group._id}`,
        {
          uid: "uid-player",
          currentScene: doctorScene._id.toString(),
          componentId,
          addFlags: [],
          removeFlags: [],
        },
        authHeaders("uid-player")
      )
      // FORBIDDEN is expected here — it's the existing signal that tells the
      // finishing player's client to redirect to the "your teammate's turn" page.
    ).rejects.toMatchObject({ response: { status: 403 } });

    // The handoff still committed even though this user got a 403.
    const dbGroup = await Group.findById(group._id);
    expect(dbGroup.path[0]).toBe(nurseScene._id.toString());

    // Notification is fire-and-forget, so wait for the background call.
    await waitForMockCall(sendEmail);
    expect(sendEmail).toHaveBeenCalledWith({
      to: "nurse@auckland.ac.nz",
      template: EmailTemplate.YOUR_TURN,
      data: { name: "Nurse Nightingale", scenarioName: "Nav Scenario" },
      signal: expect.any(AbortSignal),
    });
  });

  it("does not email anyone when the next scene has no role restriction", async () => {
    const componentId = "btn-continue";
    await Group.findByIdAndUpdate(group._id, {
      path: [scene1._id.toString()],
    });
    await Scene.findByIdAndUpdate(scene1._id, {
      components: [{ id: componentId, clickable: true, nextScene: scene2._id }],
    });

    // notifyNextRole()'s only async step on this code path is
    // Scene.findById(nextSceneId).lean() — since scene2 has no roles, it
    // returns as soon as that resolves. Piggyback on that specific lookup's
    // settlement (not the earlier Scene.findById the route handler itself
    // makes to resolve the clicked component) so we can await the
    // fire-and-forget task's actual completion, rather than only its
    // (never-happening) sendEmail call, before asserting nothing was sent.
    const originalFindById = Scene.findById.bind(Scene);
    let resolveNotifyLookup;
    const notifyLookupSettled = new Promise((resolve) => {
      resolveNotifyLookup = resolve;
    });
    const findByIdSpy = jest
      .spyOn(Scene, "findById")
      .mockImplementation((...args) => {
        const query = originalFindById(...args);
        if (args[0]?.toString() === scene2._id.toString()) {
          const originalThen = query.then.bind(query);
          query.then = (onFulfilled, onRejected) =>
            originalThen((value) => {
              resolveNotifyLookup();
              return onFulfilled ? onFulfilled(value) : value;
            }, onRejected);
        }
        return query;
      });

    const response = await axios.post(
      `http://localhost:${ctx.port}/api/navigate/group/${group._id}`,
      {
        uid: "uid-player",
        currentScene: scene1._id.toString(),
        componentId,
        addFlags: [],
        removeFlags: [],
      },
      authHeaders("uid-player")
    );
    expect(response.status).toBe(200);

    await notifyLookupSettled;

    expect(sendEmail).not.toHaveBeenCalled();
    findByIdSpy.mockRestore();
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
