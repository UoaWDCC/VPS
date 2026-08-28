import { beforeEach, describe, expect, it } from "@jest/globals";
import mongoose from "mongoose";

import User from "../../models/user.js";
import { useMongoMemoryServer } from "../../../test/testSetup.js";
import { HttpError } from "../../../util/error.js";
import {
  assignScenarioToUsers,
  createUser,
  retrieveAssignedScenarioList,
  retrieveUserByEmail,
  setUserStateVariables,
} from "../userDao.js";

describe("userDao", () => {
  useMongoMemoryServer();

  beforeEach(async () => {
    await User.deleteMany({});
  });

  it("creates a user and looks them up by email", async () => {
    await createUser({
      uid: "firebase-user-1",
      name: "Tester One",
      email: "tester1@example.com",
      pictureURL: "https://example.com/tester1.png",
      assigned: [],
    });

    const user = await retrieveUserByEmail("tester1@example.com");
    expect(user).toMatchObject({
      uid: "firebase-user-1",
      email: "tester1@example.com",
    });
  });

  it("adds the scenario id to users with and without existing assignments", async () => {
    const withAssignment = await User.create({
      uid: "firebase-user-assign-1",
      name: "Assigned user",
      email: "assigned@example.com",
      pictureURL: "https://example.com/assigned.png",
      assigned: ["existing-scenario"],
    });

    // Inserted via the raw collection so the `assigned` field is genuinely
    // absent, rather than defaulted to [] by Mongoose (as User.create would).
    const { insertedId: withoutAssignmentId } = await User.collection.insertOne(
      {
        uid: "firebase-user-assign-2",
        name: "Unassigned user",
        email: "unassigned@example.com",
        pictureURL: "https://example.com/unassigned.png",
      }
    );

    await assignScenarioToUsers("new-scenario", [
      withAssignment._id.toString(),
      withoutAssignmentId.toString(),
    ]);

    const updatedWithAssignment = await User.findById(withAssignment._id);
    const updatedWithoutAssignment = await User.findById(withoutAssignmentId);

    expect(updatedWithAssignment.assigned).toEqual(
      expect.arrayContaining(["existing-scenario", "new-scenario"])
    );
    expect(updatedWithoutAssignment.assigned).toEqual(["new-scenario"]);
  });

  it("stores user state variables and rejects unknown users with HttpError", async () => {
    const user = await User.create({
      uid: "firebase-user-2",
      name: "Tester Two",
      email: "tester2@example.com",
      pictureURL: "https://example.com/tester2.png",
      assigned: [],
      stateVariables: {
        "scenario-789": [{ id: "user-var", name: "score", value: 1 }],
      },
      stateVersions: { "scenario-789": 3 },
    });

    const updated = await setUserStateVariables(
      user._id.toString(),
      "scenario-789",
      [{ id: "user-var", name: "score", value: 9 }]
    );

    expect(updated).toEqual([[{ id: "user-var", name: "score", value: 9 }], 4]);

    await expect(
      setUserStateVariables(
        new mongoose.Types.ObjectId().toString(),
        "scenario-789",
        [{ id: "missing", name: "score", value: 0 }]
      )
    ).rejects.toBeInstanceOf(HttpError);
    await expect(
      setUserStateVariables(
        new mongoose.Types.ObjectId().toString(),
        "scenario-789",
        [{ id: "missing", name: "score", value: 0 }]
      )
    ).rejects.toMatchObject({
      status: 404,
      message: "user not found",
    });
  });

  it("returns an empty assignment list when the user has no assigned scenarios", async () => {
    await User.create({
      uid: "firebase-user-3",
      name: "Unassigned user",
      email: "empty@example.com",
      pictureURL: "https://example.com/empty.png",
    });

    await expect(
      retrieveAssignedScenarioList("firebase-user-3")
    ).resolves.toEqual([]);
  });

  it("returns false when assignment data is malformed", async () => {
    await expect(assignScenarioToUsers("scenario-999", null)).resolves.toBe(
      false
    );
  });
});
