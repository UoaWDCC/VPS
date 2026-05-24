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
import Staff from "../../../db/models/staff.js";

jest.mock("firebase-admin");

describe("Staff API tests", () => {
  let mongoServer;
  let server;
  let port;

  const staffFirebaseId = "firebase-staff-001";
  const staffEmail = "staff@wdcc.co.nz";

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
    await Staff.create({
      firebaseID: staffFirebaseId,
      emailAddress: staffEmail,
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

  it("GET /staff/:firebaseID returns 'staff' when the firebase ID is in the staff list", async () => {
    const response = await axios.get(
      `http://localhost:${port}/api/staff/${staffFirebaseId}`
    );
    expect(response.status).toBe(200);
    expect(response.data).toBe("staff");
  });

  it("GET /staff/:firebaseID returns 'user' when the firebase ID is not in the staff list", async () => {
    const response = await axios.get(
      `http://localhost:${port}/api/staff/unknown-firebase-id`
    );
    expect(response.status).toBe(200);
    expect(response.data).toBe("user");
  });

  it("GET /staff/:firebaseID returns 'user' when the staff collection is empty", async () => {
    await Staff.deleteMany({});

    const response = await axios.get(
      `http://localhost:${port}/api/staff/${staffFirebaseId}`
    );
    expect(response.status).toBe(200);
    expect(response.data).toBe("user");
  });
});
