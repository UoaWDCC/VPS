import { beforeEach, describe, expect, it } from "@jest/globals";
import mongoose from "mongoose";

import Access from "../../models/access.js";
import User from "../../models/user.js";
import { useMongoMemoryServer } from "../../../test/testSetup.js";
import {
  getAccessList,
  grantAccess,
  hasAccess,
  revokeAccess,
} from "../accessDao.js";

describe("accessDao", () => {
  useMongoMemoryServer();

  beforeEach(async () => {
    await Access.deleteMany({});
    await User.deleteMany({});
  });

  it("returns the access list and checks membership for a user email", async () => {
    await User.create({
      _id: new mongoose.Types.ObjectId("000000000000000000000111"),
      uid: "firebase-access-user",
      name: "Alice",
      email: "alice@example.com",
      pictureURL: "https://example.com/alice.png",
      assigned: [],
    });

    await Access.create({
      scenarioId: "scenario-access",
      accessList: ["alice@example.com", "bob@example.com"],
    });

    const access = await getAccessList("scenario-access");
    expect(access).toMatchObject({
      scenarioId: "scenario-access",
      accessList: ["alice@example.com", "bob@example.com"],
    });
    await expect(
      hasAccess("scenario-access", "firebase-access-user")
    ).resolves.toBe(true);
  });

  it("grants and revokes access entries without duplicating emails", async () => {
    await Access.create({
      scenarioId: "scenario-access-2",
      accessList: ["bob@example.com"],
    });

    const granted = await grantAccess("scenario-access-2", "alice@example.com");
    expect(granted.accessList).toEqual(
      expect.arrayContaining(["bob@example.com", "alice@example.com"])
    );

    const revoked = await revokeAccess("scenario-access-2", [
      "alice@example.com",
    ]);
    expect(revoked.accessList).toEqual(["bob@example.com"]);
  });
});
