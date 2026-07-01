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
import User from "../../../db/models/user.js";
import Group from "../../../db/models/group.js";
import Scenario from "../../../db/models/scenario.js";
import Scene from "../../../db/models/scene.js";
import auth from "../../../middleware/firebaseAuth.js";
import { authHeaders } from "./testHelpers.js";

jest.mock("../../../middleware/firebaseAuth");
jest.mock("firebase-admin");

auth.mockImplementation(async (req, res, next) => {
  req.body.uid = req.headers.authorization?.split(" ")[1];
  next();
});

describe("User API tests", () => {
  let mongoServer;
  let server;
  let port;

  let user1;
  let scenario;

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
    user1 = await User.create({
      uid: "uid-1",
      name: "Alice",
      email: "alice@auckland.ac.nz",
      pictureURL: "http://example.com/alice.png",
    });

    await User.create({
      uid: "uid-2",
      name: "Bob",
      email: "bob@auckland.ac.nz",
      pictureURL: "http://example.com/bob.png",
    });

    scenario = await Scenario.create({
      name: "Test Scenario",
      uid: "uid-1",
      users: ["uid-1", "uid-2"],
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

  // --- GET / ---

  it("GET /user/ returns all users", async () => {
    const response = await axios.get(`http://localhost:${port}/api/user/`);
    expect(response.status).toBe(200);
    expect(response.data).toHaveLength(2);
    const uids = response.data.map((u) => u.uid);
    expect(uids).toContain("uid-1");
    expect(uids).toContain("uid-2");
  });

  // --- GET /min ---

  it("GET /user/min returns minimal user fields sorted by name", async () => {
    const response = await axios.get(`http://localhost:${port}/api/user/min`);
    expect(response.status).toBe(200);
    expect(response.data).toHaveLength(2);
    // Should be sorted by name ascending: Alice, Bob
    expect(response.data[0].name).toBe("Alice");
    expect(response.data[1].name).toBe("Bob");
    // Only uid, name, email fields
    expect(response.data[0].uid).toBe("uid-1");
    expect(response.data[0].pictureURL).toBeUndefined();
  });

  // --- GET /:uid ---

  it("GET /user/:uid returns a user by uid", async () => {
    const response = await axios.get(
      `http://localhost:${port}/api/user/${user1.uid}`
    );
    expect(response.status).toBe(200);
    expect(Array.isArray(response.data)).toBe(true);
    expect(response.data[0].name).toBe("Alice");
  });

  it("GET /user/:uid returns empty array for unknown uid", async () => {
    const response = await axios.get(
      `http://localhost:${port}/api/user/unknown-uid`
    );
    expect(response.status).toBe(200);
    expect(response.data).toHaveLength(0);
  });

  // --- GET /played/:scenarioId ---

  // NOTE: retrievePlayedUsers reads Scenario.users, but the Scenario schema does
  // not define a 'users' field, so it is stripped on write and the query returns
  // nothing. The scenario in beforeEach is seeded with users uid-1 and uid-2, so
  // this asserts the CORRECT behaviour and is marked `it.failing`: it stays green
  // while the bug exists and turns red once the schema defines 'users' — signalling
  // that it should be un-marked.
  it.failing(
    "GET /user/played/:scenarioId returns users who played the scenario",
    async () => {
      const response = await axios.get(
        `http://localhost:${port}/api/user/played/${scenario._id}`
      );
      expect(response.status).toBe(200);
      const uids = response.data.map((u) => u.uid);
      expect(uids).toContain("uid-1");
      expect(uids).toContain("uid-2");
    }
  );

  // --- POST / (sign-in) ---

  it("POST /user/ creates a new user with allowed email domain", async () => {
    const response = await axios.post(`http://localhost:${port}/api/user/`, {
      uid: "uid-new",
      name: "New User",
      email: "newuser@auckland.ac.nz",
      pictureURL: "http://example.com/new.png",
    });
    expect(response.status).toBe(200);

    const dbUser = await User.findOne({ uid: "uid-new" });
    expect(dbUser).not.toBeNull();
    expect(dbUser.name).toBe("New User");
  });

  it("POST /user/ does not create duplicate user when user already exists", async () => {
    // user1 already exists with alice@auckland.ac.nz
    const response = await axios.post(`http://localhost:${port}/api/user/`, {
      uid: "uid-1",
      name: "Alice Duplicate",
      email: "alice@auckland.ac.nz",
      pictureURL: "http://example.com/alice.png",
    });
    expect(response.status).toBe(200);

    const dbUsers = await User.find({ email: "alice@auckland.ac.nz" });
    expect(dbUsers).toHaveLength(1);
  });

  it("POST /user/ returns 403 for disallowed email domain", async () => {
    await expect(
      axios.post(`http://localhost:${port}/api/user/`, {
        uid: "uid-x",
        name: "External",
        email: "outsider@gmail.com",
        pictureURL: "http://example.com/x.png",
      })
    ).rejects.toMatchObject({ response: { status: 403 } });
  });

  it("POST /user/ allows whitelisted test emails", async () => {
    const response = await axios.post(`http://localhost:${port}/api/user/`, {
      uid: "uid-test",
      name: "Test User",
      email: "wdccvpstesting1@gmail.com",
      pictureURL: "http://example.com/test.png",
    });
    expect(response.status).toBe(200);
  });

  // --- DELETE /:uid ---

  it("DELETE /user/:uid returns 404 for unknown uid", async () => {
    // deleteUser catches errors and returns false → sendStatus(404)
    await expect(
      axios.delete(`http://localhost:${port}/api/user/unknown-uid`)
    ).rejects.toMatchObject({ response: { status: 404 } });
  });

  // --- PUT /:uid ---

  it("PUT /user/:uid updates the user's played array", async () => {
    const response = await axios.put(
      `http://localhost:${port}/api/user/${user1.uid}`,
      { scenarioId: scenario._id.toString() }
    );
    expect(response.status).toBe(200);
    // addPlayed returns true on success, route responds with the return value
    expect(response.data).toBe(true);
  });

  // --- POST /:uid/:scenarioId/path ---

  it("POST /user/:uid/:scenarioId/path adds a scene to the user path", async () => {
    const scene = await Scene.create({ name: "S1", components: [] });

    const response = await axios.post(
      `http://localhost:${port}/api/user/${user1.uid}/${scenario._id}/path`,
      { nextSceneId: scene._id.toString() }
    );
    expect(response.status).toBe(200);

    const dbUser = await User.findOne({ uid: user1.uid });
    expect(dbUser.paths.get(scenario._id.toString())).toContain(
      scene._id.toString()
    );
  });

  // --- GET /group/:scenarioId (requires auth) ---

  it("GET /user/group/:scenarioId returns the group for an authenticated user", async () => {
    const group = await Group.create({
      users: [{ email: user1.email, name: user1.name, role: "doctor" }],
      notes: {},
      path: [],
      scenarioId: scenario._id.toString(),
      currentFlags: [],
    });

    const response = await axios.get(
      `http://localhost:${port}/api/user/group/${scenario._id}`,
      authHeaders("uid-1")
    );
    expect(response.status).toBe(200);
    expect(response.data.group._id).toBe(group._id.toString());
  });

  it("GET /user/group/:scenarioId returns null group when user is not in any group", async () => {
    const response = await axios.get(
      `http://localhost:${port}/api/user/group/${scenario._id}`,
      authHeaders("uid-1")
    );
    expect(response.status).toBe(200);
    expect(response.data.group).toBeNull();
  });
});
