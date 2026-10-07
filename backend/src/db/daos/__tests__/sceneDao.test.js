import { describe, beforeEach, it, expect } from "@jest/globals";

import mongoose from "mongoose";

import Scene from "../../models/scene.js";
import Scenario from "../../models/scenario.js";
import UploadedFile from "../../models/uploadedFile.js";
import {
  createScene,
  deleteScene,
  duplicateScene,
  getComponent,
  incrementVisisted,
  patchScene,
  retrieveScene,
  retrieveSceneList,
  updateSceneOrder,
} from "../sceneDao.js";
import { useMongoMemoryServer } from "../../../test/testSetup.js";

// createScene only takes a name, so scene content is added through patchScene
const createPatchedScene = async (scenarioId, { name, ...content }) => {
  const scene = await createScene(scenarioId, { name });
  const patch = Object.fromEntries(
    Object.entries(content).map(([field, items]) => [
      field,
      { upserted: items, deleted: [] },
    ])
  );
  return patchScene(scene._id, patch, scenarioId);
};

describe("Scene DAO patchScene tests", () => {
  useMongoMemoryServer();

  const sceneId = new mongoose.Types.ObjectId("000000000000000000000001");

  const baseScene = {
    _id: sceneId,
    name: "Test Scene",
    time: 60,
    roles: ["doctor"],
    components: [
      {
        id: "component-a",
        type: "box",
        bounds: { verts: [{ x: 0, y: 0 }] },
      },
      {
        id: "component-b",
        type: "box",
        bounds: { verts: [{ x: 10, y: 10 }] },
      },
      {
        id: "component-c",
        type: "box",
        bounds: { verts: [{ x: 20, y: 20 }] },
      },
    ],
  };

  beforeEach(async () => {
    await Scene.create(baseScene);
  });

  it("updates multiple changed components in one patch", async () => {
    await patchScene(sceneId, {
      fields: {},
      components: {
        upserted: [
          {
            id: "component-a",
            type: "box",
            bounds: { verts: [{ x: 0, y: -10 }] },
          },
          {
            id: "component-b",
            type: "box",
            bounds: { verts: [{ x: 10, y: 0 }] },
          },
          {
            id: "component-c",
            type: "box",
            bounds: { verts: [{ x: 20, y: 10 }] },
          },
        ],
        deleted: [],
      },
    });

    const updatedScene = await Scene.findById(sceneId);

    expect(updatedScene.components).toHaveLength(3);
    expect(
      updatedScene.components.find((c) => c.id === "component-a").bounds
        .verts[0].y
    ).toBe(-10);
    expect(
      updatedScene.components.find((c) => c.id === "component-b").bounds
        .verts[0].y
    ).toBe(0);
    expect(
      updatedScene.components.find((c) => c.id === "component-c").bounds
        .verts[0].y
    ).toBe(10);
  });

  it("adds new components when they do not already exist", async () => {
    await patchScene(sceneId, {
      fields: {},
      components: {
        upserted: [
          {
            id: "component-d",
            type: "box",
            bounds: { verts: [{ x: 100, y: 100 }] },
          },
        ],
        deleted: [],
      },
    });

    const updatedScene = await Scene.findById(sceneId);

    expect(updatedScene.components).toHaveLength(4);
    expect(
      updatedScene.components.find((c) => c.id === "component-d")
    ).toBeDefined();
  });

  it("deletes one component while preserving unrelated components", async () => {
    await patchScene(sceneId, {
      fields: {},
      components: { upserted: [], deleted: ["component-a"] },
    });

    const updatedScene = await Scene.findById(sceneId);

    expect(
      updatedScene.components.find((c) => c.id === "component-a")
    ).toBeUndefined();
    expect(
      updatedScene.components.find((c) => c.id === "component-b")
    ).toBeDefined();
    expect(
      updatedScene.components.find((c) => c.id === "component-c")
    ).toBeDefined();
  });

  it("handles delete and update in the same patch", async () => {
    await patchScene(sceneId, {
      fields: {},
      components: {
        upserted: [
          {
            id: "component-b",
            type: "box",
            bounds: { verts: [{ x: 999, y: 999 }] },
          },
        ],
        deleted: ["component-a"],
      },
    });

    const updatedScene = await Scene.findById(sceneId);

    expect(
      updatedScene.components.find((c) => c.id === "component-a")
    ).toBeUndefined();
    expect(
      updatedScene.components.find((c) => c.id === "component-b").bounds
        .verts[0].x
    ).toBe(999);
    expect(
      updatedScene.components.find((c) => c.id === "component-c")
    ).toBeDefined();
  });

  it("updates scene-level fields without touching components when no arrays are provided", async () => {
    // omits components/actions/defaultActionRefs/timerActionRefs entirely,
    // relying on patchScene's defaults for the {upserted, deleted} shape
    await patchScene(sceneId, {
      fields: {
        name: "Updated Scene Name",
        roles: ["patient"],
        time: 120,
      },
    });

    const updatedScene = await Scene.findById(sceneId);

    expect(updatedScene.name).toBe("Updated Scene Name");
    expect(updatedScene.roles).toEqual(["patient"]);
    expect(updatedScene.time).toBe(120);
    expect(updatedScene.components).toHaveLength(3);
  });

  it("rejects an action whose linkedScene references a scene outside the current scenario", async () => {
    const scenario = await Scenario.create({
      name: "Source scenario",
      uid: "author-2",
      scenes: [],
    });

    const localScene = await Scene.create({
      _id: new mongoose.Types.ObjectId("000000000000000000000002"),
      name: "Local Scene",
      components: [],
    });

    await Scenario.updateOne(
      { _id: scenario._id },
      { $push: { scenes: localScene._id } }
    );

    const otherScene = await Scene.create({
      _id: new mongoose.Types.ObjectId("000000000000000000000003"),
      name: "Other Scene",
      components: [],
    });

    await expect(
      createPatchedScene(scenario._id.toString(), {
        name: "Linked scene",
        components: [],
        actions: [
          {
            id: "action-1",
            name: "Go elsewhere",
            linkedScene: otherScene._id,
            conditions: [],
            operations: [],
          },
        ],
      })
    ).rejects.toMatchObject({ status: 400 });
  });

  it("rejects createScene for an unknown scenario parent and creates a name-only scene", async () => {
    const missingScenarioId = new mongoose.Types.ObjectId().toString();
    await expect(
      createScene(missingScenarioId, { name: "Missing parent" })
    ).rejects.toMatchObject({
      status: 404,
      message: "scenario not found",
    });

    const scenario = await Scenario.create({
      name: "Name-only scenario",
      uid: "author-3",
      scenes: [],
    });

    const created = await createScene(scenario._id.toString(), {
      name: "Fresh scene",
      components: [{ id: "ignored", type: "box" }],
    });

    expect(created).toMatchObject({
      name: "Fresh scene",
      components: [],
      actions: [],
      background: null,
    });
    expect(await Scenario.findById(scenario._id)).toMatchObject({
      scenes: expect.arrayContaining([created._id]),
    });
  });

  it("deletes a scene and decrements the file reference count for linked media", async () => {
    const retainingScene = await Scene.create({
      name: "Retained scene",
      components: [],
    });

    const scenario = await Scenario.create({
      name: "Media scenario",
      uid: "author-3",
      scenes: [retainingScene._id],
    });

    const uploadedFile = await UploadedFile.create({
      name: "media.png",
      type: "image",
      path: "images/media.png",
      url: "https://example.com/media.png",
      contentType: "image/png",
      size: 256,
      uploaderUid: "uploader-1",
      scenarioId: scenario._id,
      refCount: 1,
    });

    const scene = await Scene.create({
      name: "Media scene",
      components: [
        {
          id: "img-1",
          type: "image",
          fileId: uploadedFile._id.toString(),
        },
      ],
    });

    await Scenario.updateOne(
      { _id: scenario._id },
      { $push: { scenes: scene._id } }
    );

    const result = await deleteScene(
      scenario._id.toString(),
      scene._id.toString()
    );

    expect(result.deleted).toBe(true);
    const refreshedFile = await UploadedFile.findById(uploadedFile._id);
    expect(refreshedFile.refCount).toBe(0);
  });

  it("duplicates a scene, tracks visits, and enforces component lookups", async () => {
    const scenario = await Scenario.create({
      name: "Duplicate scenario",
      uid: "author-4",
      scenes: [sceneId],
    });

    const uploadedFile = await UploadedFile.create({
      name: "dupe.png",
      type: "image",
      path: "images/dupe.png",
      url: "https://example.com/dupe.png",
      contentType: "image/png",
      size: 64,
      uploaderUid: "uploader-2",
      scenarioId: scenario._id,
      refCount: 0,
    });

    const sceneWithFile = await Scene.create({
      name: "Linked scene",
      components: [
        { id: "img-dup", type: "image", fileId: uploadedFile._id.toString() },
      ],
    });

    await Scenario.updateOne(
      { _id: scenario._id },
      { $push: { scenes: sceneWithFile._id } }
    );

    const duplicate = await duplicateScene(
      scenario._id.toString(),
      sceneWithFile._id.toString()
    );
    const list = await retrieveSceneList(scenario._id.toString());

    expect(duplicate.name).toBe("Linked scene Copy");
    expect(list).toHaveLength(3);

    await incrementVisisted(sceneWithFile._id.toString());
    const updatedScene = await Scene.findById(sceneWithFile._id);
    expect(updatedScene.visited).toBe(1);

    await expect(
      getComponent(sceneWithFile._id.toString(), "missing-id")
    ).rejects.toMatchObject({
      status: 400,
    });

    const reordered = await updateSceneOrder(
      scenario._id.toString(),
      [sceneWithFile._id, sceneId, duplicate._id].map((id) => id.toString())
    );
    expect(reordered.scenes.map((id) => id.toString())).toEqual([
      sceneWithFile._id.toString(),
      sceneId.toString(),
      duplicate._id.toString(),
    ]);
  });

  it("increments visited atomically across concurrent calls for the same scene", async () => {
    const scene = await Scene.create({
      name: "Concurrent visit scene",
      components: [],
      visited: 0,
    });

    await Promise.all(
      Array.from({ length: 12 }, () => incrementVisisted(scene._id.toString()))
    );

    const refreshedScene = await Scene.findById(scene._id);
    expect(refreshedScene.visited).toBe(12);
  });

  it("rejects reorder updates when a same-length list contains a foreign scene id", async () => {
    const sceneA = await Scene.create({
      name: "Scene A",
      components: [],
    });
    const sceneB = await Scene.create({
      name: "Scene B",
      components: [],
    });
    const scenario = await Scenario.create({
      name: "Foreign reorder scenario",
      uid: "author-7",
      scenes: [sceneA._id, sceneB._id],
    });

    const foreignId = new mongoose.Types.ObjectId();
    await expect(
      updateSceneOrder(scenario._id.toString(), [sceneA._id, foreignId])
    ).resolves.toBeNull();
  });

  it("covers scenes with no actions, not-found deletes, and scene retrieval edge cases", async () => {
    const lastScene = await Scene.create({
      name: "Single scene",
      components: [],
    });
    const singleSceneScenario = await Scenario.create({
      name: "Edge scenario",
      uid: "author-5",
      scenes: [lastScene._id],
    });

    const linkScenario = await Scenario.create({
      name: "Link scenario",
      uid: "author-6",
      scenes: [new mongoose.Types.ObjectId()],
    });

    const newScene = await createScene(linkScenario._id.toString(), {
      name: "Fresh scene",
    });

    expect(await retrieveScene(newScene._id.toString())).toMatchObject({
      name: "Fresh scene",
    });

    await expect(
      createPatchedScene(linkScenario._id.toString(), {
        name: "Bad link",
        components: [],
        actions: [
          {
            id: "action-1",
            name: "Bad link action",
            linkedScene: new mongoose.Types.ObjectId(),
            conditions: [],
            operations: [],
          },
        ],
      })
    ).rejects.toMatchObject({ status: 400 });

    const lastSceneResult = await deleteScene(
      singleSceneScenario._id.toString(),
      lastScene._id.toString()
    );
    expect(lastSceneResult).toMatchObject({
      deleted: false,
      reason: "last_scene",
    });

    const notFoundResult = await deleteScene(
      linkScenario._id.toString(),
      new mongoose.Types.ObjectId().toString()
    );
    expect(notFoundResult).toMatchObject({
      deleted: false,
      reason: "not_found",
    });

    await expect(
      updateSceneOrder(linkScenario._id.toString(), [
        new mongoose.Types.ObjectId().toString(),
      ])
    ).resolves.toBeNull();
  });

  it("updates a background and maintains its file reference count", async () => {
    const firstFile = await UploadedFile.create({
      name: "first.png",
      type: "image",
      path: "images/first.png",
      url: "https://example.com/first.png",
      contentType: "image/png",
      size: 100,
      uploaderUid: "test-user",
      scenarioId: new mongoose.Types.ObjectId(),
    });
    const secondFile = await UploadedFile.create({
      name: "second.png",
      type: "image",
      path: "images/second.png",
      url: "https://example.com/second.png",
      contentType: "image/png",
      size: 200,
      uploaderUid: "test-user",
      scenarioId: new mongoose.Types.ObjectId(),
    });

    await patchScene(sceneId, {
      fields: {
        background: {
          kind: "image",
          fileId: firstFile._id,
          href: firstFile.url,
          fit: "cover",
        },
      },
    });

    let updatedScene = await Scene.findById(sceneId).lean();
    expect(updatedScene.background).toMatchObject({
      kind: "image",
      fileId: firstFile._id,
      href: firstFile.url,
      fit: "cover",
    });
    expect((await UploadedFile.findById(firstFile._id)).refCount).toBe(1);

    await patchScene(sceneId, {
      fields: {
        background: {
          kind: "image",
          fileId: secondFile._id,
          href: secondFile.url,
          fit: "contain",
        },
      },
    });

    expect((await UploadedFile.findById(firstFile._id)).refCount).toBe(0);
    expect((await UploadedFile.findById(secondFile._id)).refCount).toBe(1);

    await patchScene(sceneId, {
      fields: { background: { kind: "color", color: "#1769aaff" } },
    });

    updatedScene = await Scene.findById(sceneId).lean();
    expect(updatedScene.background).toMatchObject({
      kind: "color",
      color: "#1769aaff",
    });
    expect((await UploadedFile.findById(secondFile._id)).refCount).toBe(0);

    await patchScene(sceneId, { fields: { background: null } });
    expect((await Scene.findById(sceneId).lean()).background).toBeNull();
  });

  it("rejects incomplete or conflicting background payloads", async () => {
    const fileId = new mongoose.Types.ObjectId();
    const invalidBackgrounds = [
      {
        kind: "color",
        color: "#123456",
        fileId,
        href: "https://example.com/conflict.png",
      },
      {
        kind: "image",
        fileId,
        href: "https://example.com/conflict.png",
        color: "#123456",
      },
      { kind: "image", fileId },
      { kind: "color" },
      { kind: "gradient", color: "#123456" },
      "blue",
    ];

    for (const background of invalidBackgrounds) {
      await expect(
        patchScene(sceneId, { fields: { background } })
      ).rejects.toMatchObject({ status: 400 });
    }

    expect((await Scene.findById(sceneId).lean()).background).toBeNull();
  });

  it("updates file reference counts when a patched component's fileId changes", async () => {
    const firstFile = await UploadedFile.create({
      name: "one.png",
      type: "image",
      path: "images/one.png",
      url: "https://example.com/one.png",
      contentType: "image/png",
      size: 10,
      uploaderUid: "test-user",
      scenarioId: new mongoose.Types.ObjectId(),
      refCount: 0,
    });
    const secondFile = await UploadedFile.create({
      name: "two.png",
      type: "image",
      path: "images/two.png",
      url: "https://example.com/two.png",
      contentType: "image/png",
      size: 20,
      uploaderUid: "test-user",
      scenarioId: new mongoose.Types.ObjectId(),
      refCount: 0,
    });

    await patchScene(sceneId, {
      fields: {},
      components: {
        upserted: [
          { id: "img-1", type: "image", fileId: firstFile._id.toString() },
        ],
        deleted: [],
      },
    });
    expect((await UploadedFile.findById(firstFile._id)).refCount).toBe(1);

    await patchScene(sceneId, {
      fields: {},
      components: {
        upserted: [
          { id: "img-1", type: "image", fileId: secondFile._id.toString() },
        ],
        deleted: [],
      },
    });
    expect((await UploadedFile.findById(firstFile._id)).refCount).toBe(0);
    expect((await UploadedFile.findById(secondFile._id)).refCount).toBe(1);

    await patchScene(sceneId, {
      fields: {},
      components: { upserted: [], deleted: ["img-1"] },
    });
    expect((await UploadedFile.findById(secondFile._id)).refCount).toBe(0);
  });

  it("persists a scene with a valid action's conditions, operations, and linkedScene", async () => {
    const targetScene = await Scene.create({
      name: "Target scene",
      components: [],
    });
    const scenario = await Scenario.create({
      name: "Valid action scenario",
      uid: "author-8",
      scenes: [targetScene._id],
      stateVariables: [{ id: "hp", name: "hp", type: "number", value: 10 }],
    });

    const created = await createPatchedScene(scenario._id.toString(), {
      name: "Scene with action",
      components: [
        {
          id: "btn",
          type: "box",
          clickable: true,
          actionRefs: [
            { id: "ref-action-1", actionId: "action-1", index: "a0" },
          ],
        },
      ],
      actions: [
        {
          id: "action-1",
          name: "Heal and advance",
          linkedScene: targetScene._id,
          conditions: [
            { id: "c1", stateVariableId: "hp", comparator: "<", value: 100 },
          ],
          operations: [
            { id: "op1", stateVariableId: "hp", operation: "add", value: 5 },
          ],
        },
      ],
      defaultActionRefs: [
        { id: "ref-action-1", actionId: "action-1", index: "a0" },
      ],
      timerActionRefs: [
        { id: "ref-action-1", actionId: "action-1", index: "a0" },
      ],
    });

    expect(created.actions).toHaveLength(1);
    expect(created.actions[0]).toMatchObject({
      id: "action-1",
      name: "Heal and advance",
    });
    expect(created.actions[0].linkedScene.toString()).toBe(
      targetScene._id.toString()
    );
    expect(
      created.defaultActionRefs.map((r) => ({
        id: r.id,
        actionId: r.actionId,
        index: r.index,
      }))
    ).toEqual([{ id: "ref-action-1", actionId: "action-1", index: "a0" }]);
    expect(
      created.timerActionRefs.map((r) => ({
        id: r.id,
        actionId: r.actionId,
        index: r.index,
      }))
    ).toEqual([{ id: "ref-action-1", actionId: "action-1", index: "a0" }]);
  });

  it("rejects duplicate action ids within a scene", async () => {
    const scenario = await Scenario.create({
      name: "Duplicate id scenario",
      uid: "author-16",
      scenes: [],
    });

    await expect(
      createPatchedScene(scenario._id.toString(), {
        name: "Scene",
        components: [],
        actions: [
          {
            id: "action-1",
            name: "Advance",
            conditions: [],
            operations: [],
          },
          {
            id: "action-1",
            name: "Retreat",
            conditions: [],
            operations: [],
          },
        ],
      })
    ).rejects.toMatchObject({ status: 400 });
  });

  it("rejects duplicate action names within a scene", async () => {
    const scenario = await Scenario.create({
      name: "Duplicate name scenario",
      uid: "author-9",
      scenes: [],
    });

    await expect(
      createPatchedScene(scenario._id.toString(), {
        name: "Scene",
        components: [],
        actions: [
          {
            id: "action-1",
            name: "Advance",
            conditions: [],
            operations: [],
          },
          {
            id: "action-2",
            name: "Advance",
            conditions: [],
            operations: [],
          },
        ],
      })
    ).rejects.toMatchObject({ status: 400 });
  });

  it("rejects an action condition referencing an unknown property", async () => {
    const scenario = await Scenario.create({
      name: "Unknown property scenario",
      uid: "author-10",
      scenes: [],
      stateVariables: [{ id: "hp", name: "hp", type: "number", value: 10 }],
    });

    await expect(
      createPatchedScene(scenario._id.toString(), {
        name: "Scene",
        components: [],
        actions: [
          {
            id: "action-1",
            name: "Advance",
            conditions: [
              {
                id: "c1",
                stateVariableId: "does-not-exist",
                comparator: "=",
                value: 1,
              },
            ],
            operations: [],
          },
        ],
      })
    ).rejects.toMatchObject({ status: 400 });
  });

  it("accepts an action operation that isn't valid for its property's type", async () => {
    const scenario = await Scenario.create({
      name: "Invalid operation scenario",
      uid: "author-11",
      scenes: [],
      stateVariables: [
        { id: "flag", name: "flag", type: "boolean", value: false },
      ],
    });

    const created = await createPatchedScene(scenario._id.toString(), {
      name: "Scene",
      components: [],
      actions: [
        {
          id: "action-1",
          name: "Advance",
          conditions: [],
          // "add" is only valid for number properties, but type mismatches
          // are left for the editor to flag and playback to ignore
          operations: [
            {
              id: "op1",
              stateVariableId: "flag",
              operation: "add",
              value: 1,
            },
          ],
        },
      ],
    });

    expect(created.actions[0].operations[0]).toMatchObject({
      stateVariableId: "flag",
      operation: "add",
    });
  });

  it("rejects a defaultActionRefs entry that doesn't resolve to a scene action", async () => {
    const scenario = await Scenario.create({
      name: "Dangling default scenario",
      uid: "author-12",
      scenes: [],
    });

    await expect(
      createPatchedScene(scenario._id.toString(), {
        name: "Scene",
        components: [],
        actions: [
          {
            id: "action-1",
            name: "Advance",
            conditions: [],
            operations: [],
          },
        ],
        defaultActionRefs: [
          { id: "ref-missing-action", actionId: "missing-action", index: "a0" },
        ],
      })
    ).rejects.toMatchObject({ status: 400 });
  });

  it("rejects a timerActionRefs entry that doesn't resolve to a scene action", async () => {
    const scenario = await Scenario.create({
      name: "Dangling timer scenario",
      uid: "author-13",
      scenes: [],
    });

    await expect(
      createPatchedScene(scenario._id.toString(), {
        name: "Scene",
        components: [],
        actions: [
          {
            id: "action-1",
            name: "Advance",
            conditions: [],
            operations: [],
          },
        ],
        timerActionRefs: [
          { id: "ref-missing-action", actionId: "missing-action", index: "a0" },
        ],
      })
    ).rejects.toMatchObject({ status: 400 });
  });

  it("rejects a component actionRefs entry that doesn't resolve to a scene action", async () => {
    const scenario = await Scenario.create({
      name: "Dangling component action scenario",
      uid: "author-14",
      scenes: [],
    });

    await expect(
      createPatchedScene(scenario._id.toString(), {
        name: "Scene",
        components: [
          {
            id: "btn",
            type: "box",
            clickable: true,
            actionRefs: [
              {
                id: "ref-missing-action",
                actionId: "missing-action",
                index: "a0",
              },
            ],
          },
        ],
        actions: [
          {
            id: "action-1",
            name: "Advance",
            conditions: [],
            operations: [],
          },
        ],
      })
    ).rejects.toMatchObject({ status: 400 });
  });

  it("upserts into defaultActionRefs/timerActionRefs via patchScene, validated against persisted actions", async () => {
    await Scene.updateOne(
      { _id: sceneId },
      {
        $set: {
          actions: [
            {
              id: "action-1",
              name: "Advance",
              linkedScene: null,
              conditions: [],
              operations: [],
            },
          ],
        },
      }
    );

    // Resolves fine: "action-1" exists on the persisted scene
    await patchScene(
      sceneId,
      {
        defaultActionRefs: {
          upserted: [{ id: "ref-action-1", actionId: "action-1", index: "a0" }],
          deleted: [],
        },
      },
      new mongoose.Types.ObjectId().toString()
    );
    expect(
      (await Scene.findById(sceneId).lean()).defaultActionRefs.map((r) => ({
        id: r.id,
        actionId: r.actionId,
        index: r.index,
      }))
    ).toEqual([{ id: "ref-action-1", actionId: "action-1", index: "a0" }]);

    // Rejects: "missing-action" doesn't exist on the persisted scene, and
    // this patch doesn't touch `actions` to add it either
    await expect(
      patchScene(
        sceneId,
        {
          timerActionRefs: {
            upserted: [
              {
                id: "ref-missing-action",
                actionId: "missing-action",
                index: "a0",
              },
            ],
            deleted: [],
          },
        },
        new mongoose.Types.ObjectId().toString()
      )
    ).rejects.toMatchObject({ status: 400 });
  });

  it("deletes from defaultActionRefs/timerActionRefs without validating the removed ids", async () => {
    await Scene.updateOne(
      { _id: sceneId },
      {
        $set: {
          defaultActionRefs: [
            { id: "ref-action-1", actionId: "action-1", index: "a0" },
          ],
          timerActionRefs: [
            { id: "ref-action-1", actionId: "action-1", index: "a0" },
          ],
        },
      }
    );

    await patchScene(
      sceneId,
      {
        defaultActionRefs: { upserted: [], deleted: ["ref-action-1"] },
        // never present in the first place — removal must still be a safe no-op
        timerActionRefs: { upserted: [], deleted: ["does-not-exist"] },
      },
      new mongoose.Types.ObjectId().toString()
    );

    const updated = await Scene.findById(sceneId).lean();
    expect(updated.defaultActionRefs).toEqual([]);
    expect(
      updated.timerActionRefs.map((r) => ({
        id: r.id,
        actionId: r.actionId,
        index: r.index,
      }))
    ).toEqual([{ id: "ref-action-1", actionId: "action-1", index: "a0" }]);
  });

  it("updates one action via patchScene without re-validating other untouched actions, even if they're now stale", async () => {
    const scenario = await Scenario.create({
      name: "Partial update scenario",
      uid: "author-17",
      scenes: [sceneId],
    });

    await Scene.updateOne(
      { _id: sceneId },
      {
        $set: {
          actions: [
            {
              id: "action-stale",
              name: "Stale",
              linkedScene: null,
              // references a property that doesn't exist in this scenario —
              // if this untouched action were re-validated, the patch would 400
              conditions: [
                {
                  id: "c1",
                  stateVariableId: "does-not-exist",
                  comparator: "=",
                  value: 1,
                },
              ],
              operations: [],
            },
            {
              id: "action-live",
              name: "Live",
              linkedScene: null,
              conditions: [],
              operations: [],
            },
          ],
        },
      }
    );

    const updated = await patchScene(
      sceneId,
      {
        actions: {
          upserted: [
            {
              id: "action-live",
              name: "Live Updated",
              linkedScene: null,
              conditions: [],
              operations: [],
            },
          ],
          deleted: [],
        },
      },
      scenario._id.toString()
    );

    expect(updated.actions.find((a) => a.id === "action-live").name).toBe(
      "Live Updated"
    );
    expect(updated.actions.find((a) => a.id === "action-stale").name).toBe(
      "Stale"
    );
  });

  describe("preexisting property references on an upserted action", () => {
    const staleCondition = {
      id: "c-stale",
      stateVariableId: "deleted-prop",
      comparator: "=",
      value: 1,
    };
    const staleOperation = {
      id: "op-stale",
      stateVariableId: "flag",
      // valid when "flag" was a number, but "flag" is now a boolean
      operation: "add",
      value: 1,
    };
    const baseAction = {
      id: "action-1",
      name: "Advance",
      linkedScene: null,
      conditions: [staleCondition],
      operations: [staleOperation],
    };

    let scenarioId;

    beforeEach(async () => {
      const scenario = await Scenario.create({
        name: "Stale reference scenario",
        uid: "author-stale",
        scenes: [sceneId],
        stateVariables: [
          { id: "hp", name: "hp", type: "number", value: 10 },
          { id: "flag", name: "flag", type: "boolean", value: false },
        ],
      });
      scenarioId = scenario._id.toString();

      await Scene.updateOne(
        { _id: sceneId },
        { $set: { actions: [baseAction] } }
      );
    });

    const upsertAction = (action) =>
      patchScene(
        sceneId,
        { actions: { upserted: [action], deleted: [] } },
        scenarioId
      );

    it("allows untouched stale references when a new valid condition is added", async () => {
      const newCondition = {
        id: "c-new",
        stateVariableId: "hp",
        comparator: "<",
        value: 5,
      };

      const updated = await upsertAction({
        ...baseAction,
        conditions: [staleCondition, newCondition],
      });

      const action = updated.actions.find((a) => a.id === "action-1");
      expect(action.conditions.map((c) => c.id)).toEqual(["c-stale", "c-new"]);
      expect(action.operations.map((o) => o.id)).toEqual(["op-stale"]);
    });

    it("rejects a new condition referencing an unknown property", async () => {
      await expect(
        upsertAction({
          ...baseAction,
          conditions: [
            staleCondition,
            {
              id: "c-new",
              stateVariableId: "also-deleted",
              comparator: "=",
              value: 1,
            },
          ],
        })
      ).rejects.toMatchObject({ status: 400 });
    });

    it("rejects a stale condition repointed at a different unknown property", async () => {
      await expect(
        upsertAction({
          ...baseAction,
          conditions: [{ ...staleCondition, stateVariableId: "also-deleted" }],
        })
      ).rejects.toMatchObject({ status: 400 });
    });

    it("rejects a stale condition whose value alone was edited", async () => {
      await expect(
        upsertAction({
          ...baseAction,
          conditions: [{ ...staleCondition, value: 2 }],
        })
      ).rejects.toMatchObject({ status: 400 });
    });

    it("accepts an edited operation whose property changed type, since the property still exists", async () => {
      const updated = await upsertAction({
        ...baseAction,
        operations: [{ ...staleOperation, value: 2 }],
      });

      const action = updated.actions.find((a) => a.id === "action-1");
      expect(action.operations[0].value).toBe(2);
    });

    it("rejects a stale operation on a deleted property whose value alone was edited", async () => {
      await Scene.updateOne(
        { _id: sceneId },
        {
          $set: {
            "actions.0.operations.0.stateVariableId": "deleted-prop",
          },
        }
      );

      await expect(
        upsertAction({
          ...baseAction,
          operations: [
            { ...staleOperation, stateVariableId: "deleted-prop", value: 2 },
          ],
        })
      ).rejects.toMatchObject({ status: 400 });
    });

    it("rejects a stale condition moved to a new id", async () => {
      await expect(
        upsertAction({
          ...baseAction,
          conditions: [{ ...staleCondition, id: "c-moved" }],
        })
      ).rejects.toMatchObject({ status: 400 });
    });
  });

  it("deletes an action while leaving stale defaultActionRefs/component references untouched", async () => {
    await Scene.updateOne(
      { _id: sceneId },
      {
        $set: {
          actions: [
            {
              id: "action-1",
              name: "Advance",
              linkedScene: null,
              conditions: [],
              operations: [],
            },
          ],
          defaultActionRefs: [
            { id: "ref-action-1", actionId: "action-1", index: "a0" },
          ],
          components: [
            {
              id: "btn",
              type: "box",
              clickable: true,
              actionRefs: [
                { id: "ref-action-1", actionId: "action-1", index: "a0" },
              ],
            },
          ],
        },
      }
    );

    const updated = await patchScene(
      sceneId,
      { actions: { upserted: [], deleted: ["action-1"] } },
      new mongoose.Types.ObjectId().toString()
    );

    expect(updated.actions).toHaveLength(0);
    // no cascade — the author's UI is responsible for surfacing these as
    // stale, not the DAO for rejecting the delete or auto-cleaning them
    expect(
      updated.defaultActionRefs.map((r) => ({
        id: r.id,
        actionId: r.actionId,
        index: r.index,
      }))
    ).toEqual([{ id: "ref-action-1", actionId: "action-1", index: "a0" }]);
    expect(updated.components.find((c) => c.id === "btn").actionRefs).toEqual([
      { id: "ref-action-1", actionId: "action-1", index: "a0" },
    ]);
  });

  describe("action refs", () => {
    const ref = (id, actionId, index = "a0") => ({ id, actionId, index });
    const liveAction = {
      id: "action-live",
      name: "Live",
      linkedScene: null,
      conditions: [],
      operations: [],
    };

    beforeEach(async () => {
      // "action-deleted" was referenced before it was deleted
      await Scene.updateOne(
        { _id: sceneId },
        {
          $set: {
            actions: [liveAction],
            defaultActionRefs: [ref("ref-stale", "action-deleted")],
            components: [
              {
                id: "btn",
                type: "box",
                clickable: true,
                actionRefs: [ref("ref-stale", "action-deleted")],
              },
            ],
          },
        }
      );
    });

    const patch = (body) =>
      patchScene(sceneId, body, new mongoose.Types.ObjectId().toString());

    it("stores duplicate references to the same action", async () => {
      const updated = await patch({
        timerActionRefs: {
          upserted: [
            ref("ref-1", "action-live", "a0"),
            ref("ref-2", "action-live", "a1"),
          ],
          deleted: [],
        },
      });

      expect(updated.timerActionRefs.map((r) => r.actionId)).toEqual([
        "action-live",
        "action-live",
      ]);
    });

    it("allows a stale ref through when it's untouched or only reordered", async () => {
      const updated = await patch({
        defaultActionRefs: {
          upserted: [ref("ref-stale", "action-deleted", "a1")],
          deleted: [],
        },
      });

      expect(updated.defaultActionRefs[0].index).toBe("a1");
    });

    it("rejects a ref repointed at a missing action", async () => {
      await expect(
        patch({
          defaultActionRefs: {
            upserted: [ref("ref-stale", "also-deleted")],
            deleted: [],
          },
        })
      ).rejects.toMatchObject({ status: 400 });
    });

    it("rejects a new ref to a missing action", async () => {
      await expect(
        patch({
          defaultActionRefs: {
            upserted: [ref("ref-new", "action-deleted")],
            deleted: [],
          },
        })
      ).rejects.toMatchObject({ status: 400 });
    });

    it("still saves a component carrying a stale ref", async () => {
      const updated = await patch({
        components: {
          upserted: [
            {
              id: "btn",
              type: "box",
              clickable: true,
              x: 10,
              actionRefs: [
                ref("ref-stale", "action-deleted"),
                ref("ref-new", "action-live", "a1"),
              ],
            },
          ],
          deleted: [],
        },
      });

      const btn = updated.components.find((c) => c.id === "btn");
      expect(btn.actionRefs.map((r) => r.actionId)).toEqual([
        "action-deleted",
        "action-live",
      ]);
    });

    it("rejects a malformed ref", async () => {
      await expect(
        patch({
          timerActionRefs: {
            upserted: [{ id: "ref-1", actionId: "action-live", index: 0 }],
            deleted: [],
          },
        })
      ).rejects.toMatchObject({ status: 400 });
    });

    it("rejects refs sharing an id within one list", async () => {
      await expect(
        patch({
          timerActionRefs: {
            upserted: [
              ref("ref-1", "action-live", "a0"),
              ref("ref-1", "action-live", "a1"),
            ],
            deleted: [],
          },
        })
      ).rejects.toMatchObject({ status: 400 });
    });
  });

  it("replaces a component's entire object on upsert, including its actionRefs and other fields together", async () => {
    await Scene.updateOne(
      { _id: sceneId },
      {
        $set: {
          actions: [
            {
              id: "action-1",
              name: "Advance",
              linkedScene: null,
              conditions: [],
              operations: [],
            },
            {
              id: "action-2",
              name: "Retreat",
              linkedScene: null,
              conditions: [],
              operations: [],
            },
          ],
          components: [
            {
              id: "btn",
              type: "box",
              clickable: true,
              actionRefs: [
                { id: "ref-action-1", actionId: "action-1", index: "a0" },
              ],
              bounds: { verts: [{ x: 1, y: 1 }] },
            },
          ],
        },
      }
    );

    // whole-object upsert: the caller must resend every field it wants kept —
    // there's no targeted diff mechanism for a component's actionRefs anymore
    await patchScene(
      sceneId,
      {
        components: {
          upserted: [
            {
              id: "btn",
              type: "box",
              clickable: true,
              actionRefs: [
                { id: "ref-action-2", actionId: "action-2", index: "a0" },
              ],
              bounds: { verts: [{ x: 9, y: 9 }] },
            },
          ],
          deleted: [],
        },
      },
      new mongoose.Types.ObjectId().toString()
    );

    const updated = await Scene.findById(sceneId).lean();
    const btn = updated.components.find((c) => c.id === "btn");
    expect(btn.bounds).toEqual({ verts: [{ x: 9, y: 9 }] });
    expect(btn.actionRefs).toEqual([
      { id: "ref-action-2", actionId: "action-2", index: "a0" },
    ]);
  });

  it("drops a component's fields that are omitted from a whole-object upsert", async () => {
    await Scene.updateOne(
      { _id: sceneId },
      {
        $set: {
          components: [
            {
              id: "btn",
              type: "box",
              clickable: true,
              bounds: { verts: [{ x: 1, y: 1 }] },
            },
          ],
        },
      }
    );

    // this upsert omits `bounds` entirely — the whole object is replaced,
    // so the omitted field is dropped rather than preserved
    await patchScene(
      sceneId,
      {
        components: {
          upserted: [{ id: "btn", type: "box", clickable: false }],
          deleted: [],
        },
      },
      new mongoose.Types.ObjectId().toString()
    );

    const updated = await Scene.findById(sceneId).lean();
    const btn = updated.components.find((c) => c.id === "btn");
    expect(btn.clickable).toBe(false);
    expect(btn.bounds).toBeUndefined();
  });

  it("rejects a component actionRefs entry that doesn't resolve to a scene action, on patch upsert", async () => {
    await Scene.updateOne(
      { _id: sceneId },
      {
        $set: {
          actions: [],
          components: [{ id: "btn", type: "box", clickable: true }],
        },
      }
    );

    await expect(
      patchScene(
        sceneId,
        {
          components: {
            upserted: [
              {
                id: "btn",
                type: "box",
                clickable: true,
                actionRefs: [
                  {
                    id: "ref-missing-action",
                    actionId: "missing-action",
                    index: "a0",
                  },
                ],
              },
            ],
            deleted: [],
          },
        },
        new mongoose.Types.ObjectId().toString()
      )
    ).rejects.toMatchObject({ status: 400 });
  });

  it("validates and persists a brand-new component's inline actionRefs", async () => {
    await Scene.updateOne(
      { _id: sceneId },
      {
        $set: {
          actions: [
            {
              id: "action-1",
              name: "Advance",
              linkedScene: null,
              conditions: [],
              operations: [],
            },
          ],
        },
      }
    );

    await expect(
      patchScene(
        sceneId,
        {
          components: {
            upserted: [
              {
                id: "new-btn",
                type: "box",
                clickable: true,
                actionRefs: [
                  {
                    id: "ref-missing-action",
                    actionId: "missing-action",
                    index: "a0",
                  },
                ],
                bounds: { verts: [{ x: 0, y: 0 }] },
              },
            ],
            deleted: [],
          },
        },
        new mongoose.Types.ObjectId().toString()
      )
    ).rejects.toMatchObject({ status: 400 });

    const updated = await patchScene(
      sceneId,
      {
        components: {
          upserted: [
            {
              id: "new-btn",
              type: "box",
              clickable: true,
              actionRefs: [
                { id: "ref-action-1", actionId: "action-1", index: "a0" },
              ],
              bounds: { verts: [{ x: 0, y: 0 }] },
            },
          ],
          deleted: [],
        },
      },
      new mongoose.Types.ObjectId().toString()
    );
    expect(
      updated.components.find((c) => c.id === "new-btn").actionRefs
    ).toEqual([{ id: "ref-action-1", actionId: "action-1", index: "a0" }]);
  });

  it("nulls linkedScene across multiple scenes when the target scene is deleted", async () => {
    const targetScene = await Scene.create({
      name: "Target scene",
      components: [],
    });

    const makeLinkingScene = (name) =>
      Scene.create({
        name,
        components: [],
        actions: [
          {
            id: "action-1",
            name: "Advance",
            linkedScene: targetScene._id,
            conditions: [],
            operations: [],
          },
        ],
      });

    const sceneA = await makeLinkingScene("Scene A");
    const sceneB = await makeLinkingScene("Scene B");

    const scenario = await Scenario.create({
      name: "Multi-link scenario",
      uid: "author-15",
      scenes: [targetScene._id, sceneA._id, sceneB._id],
    });

    const result = await deleteScene(
      scenario._id.toString(),
      targetScene._id.toString()
    );
    expect(result.deleted).toBe(true);

    const [refreshedA, refreshedB] = await Promise.all([
      Scene.findById(sceneA._id).lean(),
      Scene.findById(sceneB._id).lean(),
    ]);
    expect(refreshedA.actions[0].linkedScene).toBeNull();
    expect(refreshedB.actions[0].linkedScene).toBeNull();
  });

  describe("defaultLinkedScene/timerLinkedScene", () => {
    const setupScenario = async () => {
      const targetScene = await Scene.create({
        name: "Target scene",
        components: [],
      });
      const scenario = await Scenario.create({
        name: "Linked scene scenario",
        uid: "author-17",
        scenes: [sceneId, targetScene._id],
      });
      return { scenarioId: scenario._id.toString(), targetScene };
    };

    it.each(["defaultLinkedScene", "timerLinkedScene"])(
      "persists %s when it targets a scene in the same scenario",
      async (field) => {
        const { scenarioId, targetScene } = await setupScenario();

        const updated = await patchScene(
          sceneId,
          { fields: { [field]: targetScene._id.toString() } },
          scenarioId
        );

        expect(updated[field].toString()).toBe(targetScene._id.toString());
      }
    );

    it.each(["defaultLinkedScene", "timerLinkedScene"])(
      "clears %s when patched to null",
      async (field) => {
        const { scenarioId, targetScene } = await setupScenario();
        await Scene.updateOne(
          { _id: sceneId },
          { $set: { [field]: targetScene._id } }
        );

        const updated = await patchScene(
          sceneId,
          { fields: { [field]: null } },
          scenarioId
        );

        expect(updated[field]).toBeNull();
      }
    );

    it.each(["defaultLinkedScene", "timerLinkedScene"])(
      "rejects a malformed %s with HTTP 400",
      async (field) => {
        const { scenarioId } = await setupScenario();

        for (const value of ["abc", 123, {}]) {
          await expect(
            patchScene(sceneId, { fields: { [field]: value } }, scenarioId)
          ).rejects.toMatchObject({ status: 400 });
        }
      }
    );

    it.each(["defaultLinkedScene", "timerLinkedScene"])(
      "rejects a %s outside the current scenario",
      async (field) => {
        const { scenarioId } = await setupScenario();
        const foreignScene = await Scene.create({
          name: "Foreign scene",
          components: [],
        });

        await expect(
          patchScene(
            sceneId,
            { fields: { [field]: foreignScene._id.toString() } },
            scenarioId
          )
        ).rejects.toMatchObject({ status: 400 });

        const unchanged = await Scene.findById(sceneId).lean();
        expect(unchanged[field]).toBeUndefined();
      }
    );

    it("nulls both links on other scenes when the target scene is deleted", async () => {
      const { scenarioId, targetScene } = await setupScenario();
      await Scene.updateOne(
        { _id: sceneId },
        {
          $set: {
            defaultLinkedScene: targetScene._id,
            timerLinkedScene: targetScene._id,
          },
        }
      );

      const result = await deleteScene(scenarioId, targetScene._id.toString());
      expect(result.deleted).toBe(true);

      const refreshed = await Scene.findById(sceneId).lean();
      expect(refreshed.defaultLinkedScene).toBeNull();
      expect(refreshed.timerLinkedScene).toBeNull();
    });

    it("copies both links when duplicating a scene", async () => {
      const { scenarioId, targetScene } = await setupScenario();
      await Scene.updateOne(
        { _id: sceneId },
        {
          $set: {
            defaultLinkedScene: targetScene._id,
            timerLinkedScene: targetScene._id,
          },
        }
      );

      const copy = await duplicateScene(scenarioId, sceneId);

      expect(copy.defaultLinkedScene.toString()).toBe(
        targetScene._id.toString()
      );
      expect(copy.timerLinkedScene.toString()).toBe(targetScene._id.toString());
    });
  });

  describe("duplicateScene", () => {
    it("duplicates a scene whose actions were created through patchScene", async () => {
      const scenario = await Scenario.create({
        name: "Duplicate scenario",
        uid: "author-18",
        scenes: [sceneId],
      });
      const scenarioId = scenario._id.toString();

      // shape the editor sends when creating an action
      await patchScene(
        sceneId,
        {
          actions: {
            upserted: [
              {
                id: "action-new",
                name: "New Action 1",
                linkedScene: null,
                conditions: [],
                operations: [],
              },
            ],
            deleted: [],
          },
        },
        scenarioId
      );

      const copy = await duplicateScene(scenarioId, sceneId);

      expect(copy.actions.map((a) => a.id)).toEqual(["action-new"]);
    });
  });
});
