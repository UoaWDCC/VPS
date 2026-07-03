import { jest, describe, beforeEach, it, expect } from "@jest/globals";

import express from "express";
import axios from "axios";
import routes from "../../index.js";
import Staff from "../../../db/models/staff.js";
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

describe("Staff API tests", () => {
  useMongoMemoryServer();
  const ctx = useExpressServer(() => {
    const app = express();
    app.use(express.json());
    app.use("/", routes);
    return app;
  });

  const staffFirebaseId = "firebase-staff-001";
  const staffEmail = "staff@wdcc.co.nz";

  beforeEach(async () => {
    await Staff.create({
      firebaseID: staffFirebaseId,
      emailAddress: staffEmail,
    });
  });

  it("GET /staff/:firebaseID returns 'staff' when the firebase ID is in the staff list", async () => {
    const response = await axios.get(
      `http://localhost:${ctx.port}/api/staff/${staffFirebaseId}`,
      authHeaders("user1")
    );
    expect(response.status).toBe(200);
    expect(response.data).toBe("staff");
  });

  it("GET /staff/:firebaseID returns 'user' when the firebase ID is not in the staff list", async () => {
    const response = await axios.get(
      `http://localhost:${ctx.port}/api/staff/unknown-firebase-id`,
      authHeaders("user1")
    );
    expect(response.status).toBe(200);
    expect(response.data).toBe("user");
  });

  it("GET /staff/:firebaseID returns 'user' when the staff collection is empty", async () => {
    await Staff.deleteMany({});

    const response = await axios.get(
      `http://localhost:${ctx.port}/api/staff/${staffFirebaseId}`,
      authHeaders("user1")
    );
    expect(response.status).toBe(200);
    expect(response.data).toBe("user");
  });
});
