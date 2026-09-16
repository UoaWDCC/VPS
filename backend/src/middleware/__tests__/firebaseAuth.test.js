import { jest, describe, beforeEach, it, expect } from "@jest/globals";
import { HttpStatusCode } from "axios";

import { getAuth } from "../../firebase/firebase.js";
import auth from "../firebaseAuth.js";

jest.mock("firebase-admin");
jest.mock("../../firebase/firebase.js");

const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

describe("firebaseAuth middleware", () => {
  let req;
  let res;
  let next;
  let verifyIdToken;

  beforeEach(() => {
    jest.clearAllMocks();

    req = { headers: {}, body: {} };
    res = { sendStatus: jest.fn() };
    next = jest.fn();

    verifyIdToken = jest.fn();
    getAuth.mockReturnValue({ verifyIdToken });
  });

  it("returns 401 when no authorization header is present", async () => {
    await auth(req, res, next);

    expect(res.sendStatus).toHaveBeenCalledWith(HttpStatusCode.Unauthorized);
    expect(getAuth).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it("verifies the bearer token and attaches uid to req.body and req.uid on success", async () => {
    req.headers.authorization = "Bearer valid-token";
    verifyIdToken.mockResolvedValue({ uid: "user-123" });

    await auth(req, res, next);

    expect(verifyIdToken).toHaveBeenCalledWith("valid-token");
    expect(req.body.uid).toBe("user-123");
    expect(req.uid).toBe("user-123");
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.sendStatus).not.toHaveBeenCalled();
  });

  it("returns 401 when token verification fails", async () => {
    req.headers.authorization = "Bearer invalid-token";
    verifyIdToken.mockRejectedValue(new Error("invalid token"));

    await auth(req, res, next);
    await flushPromises();

    expect(res.sendStatus).toHaveBeenCalledWith(HttpStatusCode.Unauthorized);
    expect(next).not.toHaveBeenCalled();
    expect(req.uid).toBeUndefined();
    expect(req.body.uid).toBeUndefined();
  });
});
