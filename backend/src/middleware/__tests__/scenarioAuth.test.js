import { jest, describe, beforeEach, it, expect } from "@jest/globals";

import mongoose from "mongoose";
import Access from "../../db/models/access.js";
import Scenario from "../../db/models/scenario.js";
import User from "../../db/models/user.js";
import scenarioAuth, { isAuthor, scenarioOwnerAuth } from "../scenarioAuth.js";
import { useMongoMemoryServer } from "../../test/testSetup.js";

describe("Scenario Auth Middleware tests", () => {
  const HTTP_UNAUTHORISED = 401;
  const HTTP_NOT_FOUND = 404;
  const HTTP_BAD_REQUEST = 400;

  useMongoMemoryServer();

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

  beforeEach(async () => {
    nextFunction.mockClear();
    await Scenario.create(scenario1);
    await User.create({
      uid: "user1",
      name: "Owner",
      email: "owner@example.com",
      pictureURL: "http://example.com/owner.png",
    });
    await User.create({
      uid: "user2",
      name: "Access User",
      email: "access@example.com",
      pictureURL: "http://example.com/access.png",
    });
    await Access.create({
      scenarioId: scenario1._id.toString(),
      accessList: ["access@example.com"],
    });
  });

  // -- is author function --

  it("is author returns true for owner", async () => {
    const res = await isAuthor("000000000000000000000001", "user1");
    expect(res).toEqual(true);
  });

  it("is author returns true for non-owner user on access list", async () => {
    const res = await isAuthor("000000000000000000000001", "user2");
    expect(res).toEqual(true);
  });

  it("is author returns false for unauthorised user", async () => {
    const res = await isAuthor("000000000000000000000001", "user3");
    expect(res).toEqual(false);
  });

  it("is author returns false for non-existent scenario", async () => {
    const res = await isAuthor("000000000000000000000002", "user3");
    expect(res).toEqual(false);
  });

  // -- scenario auth --

  it("scenario auth successfully authorises owner", async () => {
    const req = mockRequest("000000000000000000000001", { uid: "user1" });
    const res = mockResponse();
    await scenarioAuth(req, res, nextFunction);

    expect(nextFunction).toHaveBeenCalledTimes(1);
  });

  it("scenario auth fails unauthorised user", async () => {
    const req = mockRequest("000000000000000000000001", { uid: "user3" });
    const res = mockResponse();
    await scenarioAuth(req, res, nextFunction);
    expect(nextFunction).toHaveBeenCalledWith(
      expect.objectContaining({ status: HTTP_UNAUTHORISED })
    );
  });

  it("scenario auth allows a non-owner user when the scenario access list includes their email", async () => {
    const req = mockRequest("000000000000000000000001", { uid: "user2" });
    const res = mockResponse();

    await scenarioAuth(req, res, nextFunction);

    expect(nextFunction).toHaveBeenCalledTimes(1);
  });

  it("scenario auth fails non existent scenarioId", async () => {
    const req = mockRequest("000000000000000000000002", { uid: "user1" });
    const res = mockResponse();
    await scenarioAuth(req, res, nextFunction);
    expect(nextFunction).toHaveBeenCalledWith(
      expect.objectContaining({ status: HTTP_NOT_FOUND })
    );
  });

  it("scenario auth fails invalid scenarioId", async () => {
    const req = mockRequest("not-a-valid-id", { uid: "user1" });
    const res = mockResponse();
    await scenarioAuth(req, res, nextFunction);

    expect(nextFunction).toHaveBeenCalledWith(
      expect.objectContaining({ status: HTTP_BAD_REQUEST })
    );
  });

  // -- scenario owner auth --

  it("scenario owner auth fails non existent scenarioId", async () => {
    const req = mockRequest("000000000000000000000002", { uid: "user1" });
    const res = mockResponse();
    await scenarioOwnerAuth(req, res, nextFunction);
    expect(nextFunction).toHaveBeenCalledWith(
      expect.objectContaining({ status: HTTP_NOT_FOUND })
    );
  });

  it("scenario owner auth fails invalid scenarioId", async () => {
    const req = mockRequest("not-a-valid-id", { uid: "user1" });
    const res = mockResponse();
    await scenarioOwnerAuth(req, res, nextFunction);

    expect(nextFunction).toHaveBeenCalledWith(
      expect.objectContaining({ status: HTTP_BAD_REQUEST })
    );
  });

  it("scenario owner auth successfully authorises owner", async () => {
    const req = mockRequest("000000000000000000000001", { uid: "user1" });
    const res = mockResponse();
    await scenarioOwnerAuth(req, res, nextFunction);

    expect(nextFunction).toHaveBeenCalledTimes(1);
  });

  it("scenario owner auth rejects a non-owner user even if they are on the access list", async () => {
    const req = mockRequest("000000000000000000000001", { uid: "user2" });
    const res = mockResponse();

    await scenarioOwnerAuth(req, res, nextFunction);

    expect(nextFunction).toHaveBeenCalledWith(
      expect.objectContaining({ status: HTTP_UNAUTHORISED })
    );
  });
});
