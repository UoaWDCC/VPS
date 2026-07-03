import { jest, describe, beforeEach, it, expect } from "@jest/globals";

import express from "express";
import axios from "axios";
import routes from "../../index.js";
import Access from "../../../db/models/access.js";
import Scenario from "../../../db/models/scenario.js";
import auth from "../../../middleware/firebaseAuth.js";
import { scenarioOwnerAuth } from "../../../middleware/scenarioAuth.js";
import errorHandler from "../../../middleware/errorHandler.js";
import { authHeaders } from "./testHelpers.js";
import {
  useMongoMemoryServer,
  useExpressServer,
} from "../../../test/testSetup.js";

jest.mock("../../../middleware/firebaseAuth");
jest.mock("../../../middleware/scenarioAuth");
jest.mock("firebase-admin");

auth.mockImplementation(async (req, res, next) => {
  req.body.uid = req.headers.authorization?.split(" ")[1];
  next();
});

// The access routes are locked to the scenario owner; the mock lets every
// request through so the tests can focus on the route behaviour itself.
scenarioOwnerAuth.mockImplementation(async (req, res, next) => {
  next();
});

describe("Access API tests", () => {
  useMongoMemoryServer();
  const ctx = useExpressServer(() => {
    const app = express();
    app.use(express.json());
    app.use("/", routes);
    app.use(errorHandler);
    return app;
  });

  let scenario;

  beforeEach(async () => {
    scenario = await Scenario.create({ name: "Test Scenario", uid: "owner1" });
  });

  it("GET /access/:scenarioId returns the access list for a scenario", async () => {
    await Access.create({
      scenarioId: scenario._id.toString(),
      accessList: ["user2@example.com"],
    });

    const response = await axios.get(
      `http://localhost:${ctx.port}/api/access/${scenario._id}`,
      authHeaders("owner1")
    );
    expect(response.status).toBe(200);
    expect(response.data.scenarioId).toBe(scenario._id.toString());
    expect(response.data.accessList).toEqual(["user2@example.com"]);
  });

  it("GET /access/:scenarioId returns a stub with empty accessList when none exists", async () => {
    const response = await axios.get(
      `http://localhost:${ctx.port}/api/access/${scenario._id}`,
      authHeaders("owner1")
    );
    expect(response.status).toBe(200);
    expect(response.data.scenarioId).toBe(scenario._id.toString());
    expect(response.data.accessList).toEqual([]);
  });

  it("PATCH /access/:scenarioId/grant adds an email to the access list", async () => {
    const response = await axios.patch(
      `http://localhost:${ctx.port}/api/access/${scenario._id}/grant`,
      { email: "user3@example.com" },
      authHeaders("owner1")
    );
    expect(response.status).toBe(200);
    expect(response.data.accessList).toContain("user3@example.com");

    const dbAccess = await Access.findOne({
      scenarioId: scenario._id.toString(),
    });
    expect(dbAccess.accessList).toContain("user3@example.com");
  });

  it("PATCH /access/:scenarioId/grant normalises the email before storing it", async () => {
    const response = await axios.patch(
      `http://localhost:${ctx.port}/api/access/${scenario._id}/grant`,
      { email: "  User3@Example.com " },
      authHeaders("owner1")
    );
    expect(response.status).toBe(200);
    expect(response.data.accessList).toEqual(["user3@example.com"]);
  });

  it("PATCH /access/:scenarioId/grant returns 400 for an invalid email", async () => {
    await expect(
      axios.patch(
        `http://localhost:${ctx.port}/api/access/${scenario._id}/grant`,
        { email: "not-an-email" },
        authHeaders("owner1")
      )
    ).rejects.toMatchObject({ response: { status: 400 } });
  });

  it("PATCH /access/:scenarioId/revoke removes emails from the access list", async () => {
    await Access.create({
      scenarioId: scenario._id.toString(),
      accessList: ["user2@example.com", "user3@example.com"],
    });

    const response = await axios.patch(
      `http://localhost:${ctx.port}/api/access/${scenario._id}/revoke`,
      { emails: ["user2@example.com"] },
      authHeaders("owner1")
    );
    expect(response.status).toBe(200);
    expect(response.data.accessList).toEqual(["user3@example.com"]);

    const dbAccess = await Access.findOne({
      scenarioId: scenario._id.toString(),
    });
    expect(dbAccess.accessList).toEqual(["user3@example.com"]);
  });

  it("PATCH /access/:scenarioId/revoke returns 400 when emails is not a non-empty array", async () => {
    await expect(
      axios.patch(
        `http://localhost:${ctx.port}/api/access/${scenario._id}/revoke`,
        { emails: [] },
        authHeaders("owner1")
      )
    ).rejects.toMatchObject({ response: { status: 400 } });
  });

  it("PATCH /access/:scenarioId/revoke returns 400 for an invalid email in the array", async () => {
    await expect(
      axios.patch(
        `http://localhost:${ctx.port}/api/access/${scenario._id}/revoke`,
        { emails: ["user2@example.com", "not-an-email"] },
        authHeaders("owner1")
      )
    ).rejects.toMatchObject({ response: { status: 400 } });
  });

  it("PATCH /access/:scenarioId/revoke returns 404 when no access list exists", async () => {
    await expect(
      axios.patch(
        `http://localhost:${ctx.port}/api/access/${scenario._id}/revoke`,
        { emails: ["user2@example.com"] },
        authHeaders("owner1")
      )
    ).rejects.toMatchObject({ response: { status: 404 } });
  });
});
