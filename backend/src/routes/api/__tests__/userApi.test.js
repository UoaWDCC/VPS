import { jest, describe, beforeEach, it, expect } from "@jest/globals";

import express from "express";
import axios from "axios";
import routes from "../../index.js";
import User from "../../../db/models/user.js";
import Group from "../../../db/models/group.js";
import Scenario from "../../../db/models/scenario.js";
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

describe("User API tests", () => {
  useMongoMemoryServer();
  const ctx = useExpressServer(() => {
    const app = express();
    app.use(express.json());
    app.use("/", routes);
    return app;
  });

  let user1;
  let scenario;

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

  // --- POST / (sign-in) ---

  it("POST /user/ creates a new user with allowed email domain", async () => {
    const response = await axios.post(
      `http://localhost:${ctx.port}/api/user/`,
      {
        uid: "uid-new",
        name: "New User",
        email: "newuser@auckland.ac.nz",
        pictureURL: "http://example.com/new.png",
      }
    );
    expect(response.status).toBe(200);

    const dbUser = await User.findOne({ uid: "uid-new" });
    expect(dbUser).not.toBeNull();
    expect(dbUser.name).toBe("New User");
  });

  it("POST /user/ does not create duplicate user when user already exists", async () => {
    // user1 already exists with alice@auckland.ac.nz
    const response = await axios.post(
      `http://localhost:${ctx.port}/api/user/`,
      {
        uid: "uid-1",
        name: "Alice Duplicate",
        email: "alice@auckland.ac.nz",
        pictureURL: "http://example.com/alice.png",
      }
    );
    expect(response.status).toBe(200);

    const dbUsers = await User.find({ email: "alice@auckland.ac.nz" });
    expect(dbUsers).toHaveLength(1);
  });

  it("POST /user/ returns 403 for disallowed email domain", async () => {
    await expect(
      axios.post(`http://localhost:${ctx.port}/api/user/`, {
        uid: "uid-x",
        name: "External",
        email: "outsider@gmail.com",
        pictureURL: "http://example.com/x.png",
      })
    ).rejects.toMatchObject({ response: { status: 403 } });
  });

  it("POST /user/ allows whitelisted test emails", async () => {
    const response = await axios.post(
      `http://localhost:${ctx.port}/api/user/`,
      {
        uid: "uid-test",
        name: "Test User",
        email: "wdccvpstesting1@gmail.com",
        pictureURL: "http://example.com/test.png",
      }
    );
    expect(response.status).toBe(200);
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
      `http://localhost:${ctx.port}/api/user/group/${scenario._id}`,
      authHeaders("uid-1")
    );
    expect(response.status).toBe(200);
    expect(response.data.group._id).toBe(group._id.toString());
  });

  it("GET /user/group/:scenarioId returns null group when user is not in any group", async () => {
    const response = await axios.get(
      `http://localhost:${ctx.port}/api/user/group/${scenario._id}`,
      authHeaders("uid-1")
    );
    expect(response.status).toBe(200);
    expect(response.data.group).toBeNull();
  });
});
