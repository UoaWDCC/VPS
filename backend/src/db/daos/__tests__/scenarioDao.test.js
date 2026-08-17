import { beforeEach, describe, expect, it } from "@jest/globals";
import mongoose from "mongoose";

import Scenario from "../../models/scenario.js";
import { useMongoMemoryServer } from "../../../test/testSetup.js";
import { HttpError } from "../../../util/error.js";
import {
  createStateVariable,
  deleteStateVariable,
  updateRoleList,
} from "../scenarioDao.js";

describe("scenarioDao", () => {
  useMongoMemoryServer();

  beforeEach(async () => {
    await Scenario.deleteMany({});
  });

  it("creates and removes state variables by identifier", async () => {
    const scenario = await Scenario.create({
      name: "Stateful scenario",
      uid: "user-1",
      scenes: [new mongoose.Types.ObjectId()],
      stateVariables: [{ id: "initial", name: "health", type: "number" }],
    });

    const updated = await createStateVariable(scenario._id.toString(), {
      name: "score",
      type: "number",
      value: 7,
    });

    expect(updated).toHaveLength(2);
    expect(updated[1]).toMatchObject({ name: "score", type: "number" });
    expect(updated[1].id).toBeTruthy();

    const afterDelete = await deleteStateVariable(
      scenario._id.toString(),
      updated[1].id
    );

    expect(afterDelete).toHaveLength(1);
    expect(afterDelete[0]).toMatchObject({ name: "health" });
  });

  it("merges role lists without creating case-insensitive duplicates", async () => {
    const scenario = await Scenario.create({
      name: "Roles scenario",
      uid: "user-2",
      scenes: [new mongoose.Types.ObjectId()],
      roleList: ["Doctor", "Nurse"],
    });

    const updated = await updateRoleList(scenario._id.toString(), [
      "doctor",
      "Engineer",
      "nurse",
    ]);

    expect(updated.roleList).toEqual(["Doctor", "Nurse", "Engineer"]);
  });

  it("throws HttpError when a scenario does not exist for state updates", async () => {
    await expect(
      createStateVariable(new mongoose.Types.ObjectId().toString(), {
        name: "score",
        type: "number",
      })
    ).rejects.toBeInstanceOf(HttpError);
  });
});
