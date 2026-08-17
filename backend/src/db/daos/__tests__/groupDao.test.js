import { beforeEach, describe, expect, it } from "@jest/globals";
import mongoose from "mongoose";

import Group from "../../models/group.js";
import { useMongoMemoryServer } from "../../../test/testSetup.js";
import { HttpError } from "../../../util/error.js";
import {
  createGroup,
  removeUserFromGroup,
  setGroupStateVariables,
} from "../groupDao.js";

describe("groupDao", () => {
  useMongoMemoryServer();

  beforeEach(async () => {
    await Group.deleteMany({});
  });

  it("stores group state variables and rejects unknown groups with HttpError", async () => {
    const group = await Group.create({
      scenarioId: "scenario-456",
      users: [{ email: "team@example.com" }],
      path: [],
      stateVariables: [{ id: "group-var", name: "hp", value: 10 }],
      stateVersion: 1,
    });

    const updated = await setGroupStateVariables(group._id.toString(), [
      { id: "group-var", name: "hp", value: 20 },
    ]);

    expect(updated).toEqual([[{ id: "group-var", name: "hp", value: 20 }], 2]);

    await expect(
      setGroupStateVariables(new mongoose.Types.ObjectId().toString(), [
        { id: "missing", name: "hp", value: 1 },
      ])
    ).rejects.toBeInstanceOf(HttpError);
  });

  it("creates a group and removes a matching user by email", async () => {
    const group = await createGroup("scenario-group", [
      { email: "alice@example.com", role: "doctor" },
      { email: "bob@example.com", role: "nurse" },
    ]);

    const updated = await removeUserFromGroup(
      group._id.toString(),
      "scenario-group",
      "ALICE@example.com"
    );

    expect(updated.users).toHaveLength(1);
    expect(updated.users[0].email).toBe("bob@example.com");
  });
});
