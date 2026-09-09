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
      createScene(scenario._id.toString(), {
        name: "Linked scene",
        components: [],
        actions: [
          {
            id: "action-1",
            name: "Go elsewhere",
            linkedScene: otherScene._id,
            conditions: [],
            operations: [],
            index: 0,
          },
        ],
      })
    ).rejects.toMatchObject({ status: 400 });
  });

  it("rejects createScene for an unknown scenario parent and increments file refs for created scenes", async () => {
    const missingScenarioId = new mongoose.Types.ObjectId().toString();
    await expect(
      createScene(missingScenarioId, {
        name: "Missing parent",
        components: [],
      })
    ).rejects.toMatchObject({
      status: 404,
      message: "scenario not found",
    });

    const scenario = await Scenario.create({
      name: "File scenario",
      uid: "author-3",
      scenes: [],
    });

    const uploadedFile = await UploadedFile.create({
      name: "clip.png",
      type: "image",
      path: "images/clip.png",
      url: "https://example.com/clip.png",
      contentType: "image/png",
      size: 128,
      uploaderUid: "uploader-3",
      scenarioId: scenario._id,
      refCount: 0,
    });

    const created = await createScene(scenario._id.toString(), {
      name: "File scene",
      components: [
        { id: "img-1", type: "image", fileId: uploadedFile._id.toString() },
      ],
    });

    expect(created).toMatchObject({ name: "File scene" });
    expect(await Scenario.findById(scenario._id)).toMatchObject({
      scenes: expect.arrayContaining([created._id]),
    });

    const refreshedFile = await UploadedFile.findById(uploadedFile._id);
    expect(refreshedFile.refCount).toBe(1);
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
      components: [],
    });

    expect(await retrieveScene(newScene._id.toString())).toMatchObject({
      name: "Fresh scene",
    });

    await expect(
      createScene(linkScenario._id.toString(), {
        name: "Bad link",
        components: [],
        actions: [
          {
            id: "action-1",
            name: "Bad link action",
            linkedScene: new mongoose.Types.ObjectId(),
            conditions: [],
            operations: [],
            index: 0,
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

    const created = await createScene(scenario._id.toString(), {
      name: "Scene with action",
      components: [
        {
          id: "btn",
          type: "box",
          clickable: true,
          actionRefs: [{ index: 0, id: "action-1" }],
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
          index: 0,
        },
      ],
      defaultActionRefs: [{ index: 0, id: "action-1" }],
      timerActionRefs: [{ index: 0, id: "action-1" }],
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
      created.defaultActionRefs.map((r) => ({ index: r.index, id: r.id }))
    ).toEqual([{ index: 0, id: "action-1" }]);
    expect(
      created.timerActionRefs.map((r) => ({ index: r.index, id: r.id }))
    ).toEqual([{ index: 0, id: "action-1" }]);
  });

  it("rejects duplicate action ids within a scene", async () => {
    const scenario = await Scenario.create({
      name: "Duplicate id scenario",
      uid: "author-16",
      scenes: [],
    });

    await expect(
      createScene(scenario._id.toString(), {
        name: "Scene",
        components: [],
        actions: [
          {
            id: "action-1",
            name: "Advance",
            conditions: [],
            operations: [],
            index: 0,
          },
          {
            id: "action-1",
            name: "Retreat",
            conditions: [],
            operations: [],
            index: 1,
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
      createScene(scenario._id.toString(), {
        name: "Scene",
        components: [],
        actions: [
          {
            id: "action-1",
            name: "Advance",
            conditions: [],
            operations: [],
            index: 0,
          },
          {
            id: "action-2",
            name: "Advance",
            conditions: [],
            operations: [],
            index: 1,
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
      createScene(scenario._id.toString(), {
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
            index: 0,
          },
        ],
      })
    ).rejects.toMatchObject({ status: 400 });
  });

  it("rejects an action operation that isn't valid for its property's type", async () => {
    const scenario = await Scenario.create({
      name: "Invalid operation scenario",
      uid: "author-11",
      scenes: [],
      stateVariables: [
        { id: "flag", name: "flag", type: "boolean", value: false },
      ],
    });

    await expect(
      createScene(scenario._id.toString(), {
        name: "Scene",
        components: [],
        actions: [
          {
            id: "action-1",
            name: "Advance",
            conditions: [],
            // "add" is only valid for number properties, not boolean ones
            operations: [
              {
                id: "op1",
                stateVariableId: "flag",
                operation: "add",
                value: 1,
              },
            ],
            index: 0,
          },
        ],
      })
    ).rejects.toMatchObject({ status: 400 });
  });

  it("rejects a defaultActionRefs entry that doesn't resolve to a scene action", async () => {
    const scenario = await Scenario.create({
      name: "Dangling default scenario",
      uid: "author-12",
      scenes: [],
    });

    await expect(
      createScene(scenario._id.toString(), {
        name: "Scene",
        components: [],
        actions: [
          {
            id: "action-1",
            name: "Advance",
            conditions: [],
            operations: [],
            index: 0,
          },
        ],
        defaultActionRefs: [{ index: 0, id: "missing-action" }],
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
      createScene(scenario._id.toString(), {
        name: "Scene",
        components: [],
        actions: [
          {
            id: "action-1",
            name: "Advance",
            conditions: [],
            operations: [],
            index: 0,
          },
        ],
        timerActionRefs: [{ index: 0, id: "missing-action" }],
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
      createScene(scenario._id.toString(), {
        name: "Scene",
        components: [
          {
            id: "btn",
            type: "box",
            clickable: true,
            actionRefs: [{ index: 0, id: "missing-action" }],
          },
        ],
        actions: [
          {
            id: "action-1",
            name: "Advance",
            conditions: [],
            operations: [],
            index: 0,
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
              index: 0,
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
          upserted: [{ index: 0, id: "action-1" }],
          deleted: [],
        },
      },
      new mongoose.Types.ObjectId().toString()
    );
    expect(
      (await Scene.findById(sceneId).lean()).defaultActionRefs.map((r) => ({
        index: r.index,
        id: r.id,
      }))
    ).toEqual([{ index: 0, id: "action-1" }]);

    // Rejects: "missing-action" doesn't exist on the persisted scene, and
    // this patch doesn't touch `actions` to add it either
    await expect(
      patchScene(
        sceneId,
        {
          timerActionRefs: {
            upserted: [{ index: 0, id: "missing-action" }],
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
          defaultActionRefs: [{ index: 0, id: "action-1" }],
          timerActionRefs: [{ index: 0, id: "action-1" }],
        },
      }
    );

    await patchScene(
      sceneId,
      {
        defaultActionRefs: { upserted: [], deleted: ["action-1"] },
        // never present in the first place — removal must still be a safe no-op
        timerActionRefs: { upserted: [], deleted: ["does-not-exist"] },
      },
      new mongoose.Types.ObjectId().toString()
    );

    const updated = await Scene.findById(sceneId).lean();
    expect(updated.defaultActionRefs).toEqual([]);
    expect(
      updated.timerActionRefs.map((r) => ({ index: r.index, id: r.id }))
    ).toEqual([{ index: 0, id: "action-1" }]);
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
              index: 0,
            },
            {
              id: "action-live",
              name: "Live",
              linkedScene: null,
              conditions: [],
              operations: [],
              index: 1,
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
              index: 1,
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
              index: 0,
            },
          ],
          defaultActionRefs: [{ index: 0, id: "action-1" }],
          components: [
            {
              id: "btn",
              type: "box",
              clickable: true,
              actionRefs: [{ index: 0, id: "action-1" }],
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
      updated.defaultActionRefs.map((r) => ({ index: r.index, id: r.id }))
    ).toEqual([{ index: 0, id: "action-1" }]);
    expect(updated.components.find((c) => c.id === "btn").actionRefs).toEqual([
      { index: 0, id: "action-1" },
    ]);
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
              index: 0,
            },
            {
              id: "action-2",
              name: "Retreat",
              linkedScene: null,
              conditions: [],
              operations: [],
              index: 1,
            },
          ],
          components: [
            {
              id: "btn",
              type: "box",
              clickable: true,
              actionRefs: [{ index: 0, id: "action-1" }],
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
              actionRefs: [{ index: 0, id: "action-2" }],
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
    expect(btn.actionRefs).toEqual([{ index: 0, id: "action-2" }]);
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
                actionRefs: [{ index: 0, id: "missing-action" }],
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
              index: 0,
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
                actionRefs: [{ index: 0, id: "missing-action" }],
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
              actionRefs: [{ index: 0, id: "action-1" }],
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
    ).toEqual([{ index: 0, id: "action-1" }]);
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
            index: 0,
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
});
