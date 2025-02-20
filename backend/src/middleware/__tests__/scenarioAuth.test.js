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
import mongoose from "mongoose";
import Scenario from "../../db/models/scenario.js";
import scenarioAuth from "../scenarioAuth.js";

describe("Scenario Auth Middleware tests", () => {
  const HTTP_UNAUTHORISED = 401;
  const HTTP_NOT_FOUND = 404;

  let mongoServer;

  const scenario1 = {
    _id: new mongoose.mongo.ObjectId("000000000000000000000001"),
    name: "Scenario 1",
    uid: "user1",
  };

  const mockRequest = (scenarioId, bodyContent) => ({
    params: { scenarioId },
    body: bodyContent,
  });

  const mockResponse = () => {
    const res = {};
    res.sendStatus = jest.fn().mockReturnValue(res);
    return res;
  };

  const nextFunction = jest.fn();

  // setup in-memory mongodb and express API
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();

    await mongoose.connect(uri);
  });

  beforeEach(async () => {
    // Add scenario to database
    await Scenario.create(scenario1);
  });

  // clear the database
  afterEach(async () => {
    await mongoose.connection.db.dropDatabase();
  });

  // close the mongodb and express servers
  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  it("successfully authorise user for scenario", async () => {
    const req = mockRequest("000000000000000000000001", { uid: "user1" });
    const res = mockResponse();
    await scenarioAuth(req, res, nextFunction);

    expect(nextFunction).toBeCalledTimes(1);
  });

  it("fails unauthorised user for scenario", async () => {
    const req = mockRequest("000000000000000000000001", { uid: "user2" });
    const res = mockResponse();
    await scenarioAuth(req, res, nextFunction);
    expect(res.sendStatus).toHaveBeenCalledWith(HTTP_UNAUTHORISED);
  });

  it("fails authorised user, invalid scenarioId", async () => {
    const req = mockRequest("000000000000000000000002", { uid: "user1" });
    const res = mockResponse();
    await scenarioAuth(req, res, nextFunction);
    expect(res.sendStatus).toHaveBeenCalledWith(HTTP_NOT_FOUND);
  });
});
