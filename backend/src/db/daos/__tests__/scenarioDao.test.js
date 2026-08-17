import { beforeEach, describe, expect, it } from "@jest/globals";
import mongoose from "mongoose";

import Scenario from "../../models/scenario.js";
import Scene from "../../models/scene.js";
import { useMongoMemoryServer } from "../../../test/testSetup.js";
import { HttpError } from "../../../util/error.js";
import {
  createRole,
  createStateVariable,
  deleteRole,
  deleteScenario,
  deleteStateVariable,
  editStateVariable,
  getStateVariables,
  retrieveAccessibleScenarios,
  retrieveScenarioList,
  retrieveScenarios,
  updateDurations,
  updateRoleList,
  updateScenario,
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

  it("returns empty values when access and state data are absent", async () => {
    await expect(retrieveAccessibleScenarios(null)).resolves.toEqual([]);

    const scenario = await Scenario.create({
      name: "No variables scenario",
      uid: "user-3",
      scenes: [new mongoose.Types.ObjectId()],
    });

    await expect(getStateVariables(scenario._id.toString())).resolves.toEqual(
      []
    );
    await expect(deleteScenario("not-a-valid-id")).resolves.toBe(false);
  });

  it("does not duplicate roles and removes them from scenes when deleting a role", async () => {
    const scene = await Scene.create({
      name: "Role scene",
      roles: ["Doctor"],
      components: [],
    });

    const scenario = await Scenario.create({
      name: "Role cleanup scenario",
      uid: "user-4",
      scenes: [scene._id],
      roleList: ["Doctor"],
    });

    await expect(
      createRole(scenario._id.toString(), "doctor")
    ).resolves.toEqual(["Doctor"]);
    await expect(
      deleteRole(scenario._id.toString(), "Doctor")
    ).resolves.toEqual([]);

    const updatedScene = await Scene.findById(scene._id);
    expect(updatedScene.roles).toEqual([]);
  });

  it("covers fallback access and legacy state-variable edit paths", async () => {
    await expect(retrieveAccessibleScenarios(undefined)).resolves.toEqual([]);
    await expect(retrieveAccessibleScenarios("unknown-user")).resolves.toEqual(
      []
    );
    await expect(retrieveScenarios([])).resolves.toEqual([]);

    const noUserScenario = await Scenario.create({
      name: "No user scenario",
      uid: "user-5",
      scenes: [new mongoose.Types.ObjectId()],
    });
    await expect(retrieveScenarioList("user-5")).resolves.toEqual([
      expect.objectContaining({ _id: noUserScenario._id }),
    ]);

    const scenario = await Scenario.create({
      name: "Legacy update",
      uid: "user-6",
      scenes: [new mongoose.Types.ObjectId()],
      stateVariables: [{ name: "hp", type: "number", value: 2 }],
    });

    await expect(
      updateScenario(scenario._id.toString(), {
        name: "   ",
        description: "updated-description",
        estimatedTime: "5 mins",
      })
    ).resolves.toMatchObject({
      description: "updated-description",
      estimatedTime: "5 mins",
      name: "Legacy update",
    });

    const edited = await editStateVariable(scenario._id.toString(), "hp", {
      name: "hp",
      type: "number",
      value: 9,
    });
    expect(edited[0]).toMatchObject({ value: 9 });

    const byId = await createStateVariable(scenario._id.toString(), {
      name: "mana",
      type: "number",
      value: 3,
    });
    await expect(
      deleteStateVariable(scenario._id.toString(), byId[1].id)
    ).resolves.toHaveLength(1);

    await expect(
      updateDurations(new mongoose.Types.ObjectId().toString(), {
        userId: "missing",
        value: 1,
      })
    ).rejects.toBeInstanceOf(HttpError);
  });
});
