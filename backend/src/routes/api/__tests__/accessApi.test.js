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
import Access from "../../../db/models/access.js";
import Scenario from "../../../db/models/scenario.js";
import User from "../../../db/models/user.js";
import auth from "../../../middleware/firebaseAuth.js";
import scenarioAuth from "../../../middleware/scenarioAuth.js";
import { authHeaders } from "./testHelpers.js";

jest.mock("../../../middleware/firebaseAuth");
jest.mock("../../../middleware/scenarioAuth");
jest.mock("firebase-admin");

auth.mockImplementation(async (req, res, next) => {
  req.body.uid = req.headers.authorization?.split(" ")[1];
  next();
});

scenarioAuth.mockImplementation(async (req, res, next) => {
  next();
});

describe("Access API tests", () => {
  let mongoServer;
  let server;
  let port;

  let scenario;
  let accessList;
  let ownerUser;
  let grantedUser;

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
    scenario = await Scenario.create({ name: "Test Scenario", uid: "owner1" });

    ownerUser = await User.create({
      uid: "owner1",
      name: "Owner",
      email: "owner@example.com",
      pictureURL: "http://example.com/pic.png",
    });

    grantedUser = await User.create({
      uid: "user2",
      name: "Granted User",
      email: "user2@example.com",
      pictureURL: "http://example.com/pic2.png",
    });

    accessList = await Access.create({
      scenarioId: scenario._id.toString(),
      name: scenario.name,
      ownerId: ownerUser.uid,
      users: {
        [ownerUser.uid]: { name: ownerUser.name, email: ownerUser.email },
        [grantedUser.uid]: { name: grantedUser.name, email: grantedUser.email },
      },
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

  it("GET /access/ returns accessible scenarios for a non-owner user", async () => {
    const response = await axios.get(
      `http://localhost:${port}/api/access/`,
      authHeaders("user2")
    );
    expect(response.status).toBe(200);
    expect(Array.isArray(response.data)).toBe(true);
    expect(response.data.length).toBeGreaterThanOrEqual(1);
  });

  it("GET /access/ returns empty array when user has no accessible scenarios", async () => {
    const response = await axios.get(
      `http://localhost:${port}/api/access/`,
      authHeaders("unknown-user")
    );
    expect(response.status).toBe(200);
    expect(response.data).toEqual([]);
  });

  it("GET /access/:scenarioId/users returns the access list for a scenario", async () => {
    const response = await axios.get(
      `http://localhost:${port}/api/access/${scenario._id}/users`,
      authHeaders("owner1")
    );
    expect(response.status).toBe(200);
    expect(response.data.scenarioId).toBe(scenario._id.toString());
    expect(response.data.ownerId).toBe("owner1");
    expect(response.data.users[grantedUser.uid]).toBeDefined();
  });

  it("GET /access/:scenarioId/users returns 200 with 404 body when access list not found", async () => {
    // Route returns 200 { status: 404, error: "Not found" } instead of HTTP 404
    const response = await axios.get(
      `http://localhost:${port}/api/access/000000000000000000000099/users`,
      authHeaders("owner1")
    );
    expect(response.status).toBe(200);
    expect(response.data.status).toBe(404);
  });

  it("PUT /access/:scenarioId/users/:userId grants access to a new user", async () => {
    const newUser = await User.create({
      uid: "user3",
      name: "New User",
      email: "user3@example.com",
      pictureURL: "http://example.com/pic3.png",
    });

    const response = await axios.put(
      `http://localhost:${port}/api/access/${scenario._id}/users/${newUser.uid}`,
      {},
      authHeaders("owner1")
    );
    expect(response.status).toBe(200);
    expect(response.data.users[newUser.uid]).toBeDefined();
    expect(response.data.users[newUser.uid].email).toBe(newUser.email);
  });

  it("DELETE /access/:scenarioId/users/:userId revokes access for a non-owner", async () => {
    const response = await axios.delete(
      `http://localhost:${port}/api/access/${scenario._id}/users/${grantedUser.uid}`,
      authHeaders("owner1")
    );
    expect(response.status).toBe(200);
    expect(response.data.status).toBe(200);

    const dbAccess = await Access.findOne({
      scenarioId: scenario._id.toString(),
    });
    expect(dbAccess.users.has(grantedUser.uid)).toBe(false);
  });

  it("DELETE /access/:scenarioId/users/:userId returns 403 when revoking the owner", async () => {
    await expect(
      axios.delete(
        `http://localhost:${port}/api/access/${scenario._id}/users/${ownerUser.uid}`,
        authHeaders("owner1")
      )
    ).rejects.toMatchObject({ response: { status: 403 } });
  });

  it("DELETE /access/:scenarioId deletes the entire access list", async () => {
    const response = await axios.delete(
      `http://localhost:${port}/api/access/${scenario._id}`,
      { ...authHeaders("owner1"), data: { uid: "owner1" } }
    );
    expect(response.status).toBe(200);
    expect(response.data).toBe(true);

    const dbAccess = await Access.findOne({
      scenarioId: scenario._id.toString(),
    });
    expect(dbAccess).toBeNull();
  });

  it("POST /access/:scenarioId/create creates an access list", async () => {
    await Access.deleteOne({ scenarioId: scenario._id.toString() });

    const response = await axios.post(
      `http://localhost:${port}/api/access/${scenario._id}/create`,
      {},
      authHeaders("owner1")
    );
    expect(response.status).toBe(201);
    expect(response.data.scenarioId).toBe(scenario._id.toString());
    expect(response.data.ownerId).toBe("owner1");
  });

  it("POST /access/:scenarioId/create returns 401 when no uid is provided", async () => {
    auth.mockImplementationOnce(async (req, res, next) => {
      // uid intentionally omitted
      next();
    });

    await expect(
      axios.post(
        `http://localhost:${port}/api/access/${scenario._id}/create`,
        {},
        authHeaders("owner1")
      )
    ).rejects.toMatchObject({ response: { status: 401 } });
  });

  it("POST /access/:scenarioId/create returns 404 when scenario does not exist", async () => {
    await expect(
      axios.post(
        `http://localhost:${port}/api/access/000000000000000000000099/create`,
        {},
        authHeaders("owner1")
      )
    ).rejects.toMatchObject({ response: { status: 404 } });
  });
});
