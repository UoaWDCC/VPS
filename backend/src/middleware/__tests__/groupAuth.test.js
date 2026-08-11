import { jest, describe, beforeEach, it, expect } from "@jest/globals";

import Group from "../../db/models/group.js";
import User from "../../db/models/user.js";
import groupAuth from "../groupAuth.js";
import { useMongoMemoryServer } from "../../test/testSetup.js";

describe("Group Auth Middleware tests", () => {
  const HTTP_NOT_FOUND = 404;
  const HTTP_FORBIDDEN = 403;

  useMongoMemoryServer();

  const mockRequest = (groupId, bodyContent = {}) => ({
    params: { groupId },
    body: bodyContent,
  });

  const nextFunction = jest.fn();

  beforeEach(async () => {
    nextFunction.mockClear();
    await User.create({
      uid: "user1",
      name: "Doctor",
      email: "doctor@example.com",
      pictureURL: "http://example.com/doctor.png",
    });
    await User.create({
      uid: "outsider",
      name: "Outsider",
      email: "outsider@example.com",
      pictureURL: "http://example.com/outsider.png",
    });
  });

  it("authorises a member of the group", async () => {
    const group = await Group.create({
      users: [{ email: "doctor@example.com", name: "Doctor", role: "doctor" }],
      notes: {},
      path: [],
      scenarioId: "scenario-001",
      currentFlags: [],
    });

    const req = mockRequest(group._id.toString(), { uid: "user1" });
    const next = jest.fn();

    await groupAuth(req, {}, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.body.membership).toMatchObject({ email: "doctor@example.com" });
  });

  it("rejects a non-member of the group", async () => {
    const group = await Group.create({
      users: [{ email: "doctor@example.com", name: "Doctor", role: "doctor" }],
      notes: {},
      path: [],
      scenarioId: "scenario-002",
      currentFlags: [],
    });

    const req = mockRequest(group._id.toString(), { uid: "outsider" });
    const next = jest.fn();

    await groupAuth(req, {}, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ status: HTTP_FORBIDDEN })
    );
  });

  it("rejects an invalid group id", async () => {
    const req = mockRequest("not-a-valid-id", { uid: "user1" });
    const next = jest.fn();

    await groupAuth(req, {}, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ status: HTTP_NOT_FOUND })
    );
  });

  it("rejects an non-existent group id", async () => {
    const req = mockRequest("000000000000000000000002", { uid: "user1" });
    const next = jest.fn();

    await groupAuth(req, {}, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ status: HTTP_NOT_FOUND })
    );
  });
});
