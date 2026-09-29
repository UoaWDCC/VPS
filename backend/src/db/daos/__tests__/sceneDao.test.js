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
  const otherSceneId = new mongoose.Types.ObjectId("0000000000000000000000a2");
  const scenarioId = new mongoose.Types.ObjectId("000000000000000000000099");

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
    await Scene.create({
      _id: otherSceneId,
      name: "Other Scene",
      components: [],
    });
    await Scenario.create({
      _id: scenarioId,
      name: "Test Scenario",
      uid: "test-uid",
      scenes: [sceneId, otherSceneId],
    });
  });

  it("updates multiple changed components in one patch", async () => {
    await patchScene(sceneId, {
      fields: {},
      components: [
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
      deletedComponentIds: [],
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
      components: [
        {
          id: "component-d",
          type: "box",
          bounds: { verts: [{ x: 100, y: 100 }] },
        },
      ],
      deletedComponentIds: [],
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
      components: [],
      deletedComponentIds: ["component-a"],
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
      components: [
        {
          id: "component-b",
          type: "box",
          bounds: { verts: [{ x: 999, y: 999 }] },
        },
      ],
      deletedComponentIds: ["component-a"],
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

  it("updates scene-level fields without overwriting components", async () => {
    await patchScene(sceneId, {
      fields: {
        name: "Updated Scene Name",
        roles: ["patient"],
        time: 120,
        directLinkKey: "W",
      },
      components: [],
      deletedComponentIds: [],
    });

    const updatedScene = await Scene.findById(sceneId);

    expect(updatedScene.name).toBe("Updated Scene Name");
    expect(updatedScene.roles).toEqual(["patient"]);
    expect(updatedScene.time).toBe(120);
    expect(updatedScene.directLinkKey).toBe("W");
    expect(updatedScene.components).toHaveLength(3);
  });

  it("rejects a patch where the same component id appears twice", async () => {
    await expect(
      patchScene(sceneId, {
        fields: {},
        components: [
          {
            id: "component-a",
            type: "box",
            bounds: { verts: [{ x: 1, y: 1 }] },
          },
          {
            id: "component-a",
            type: "box",
            bounds: { verts: [{ x: 2, y: 2 }] },
          },
        ],
        deletedComponentIds: [],
      })
    ).rejects.toThrow(/appear more than once/);

    const scene = await Scene.findById(sceneId);
    expect(
      scene.components.find((c) => c.id === "component-a").bounds.verts[0]
    ).toEqual({ x: 0, y: 0 });
  });

  it("rejects a patch where two clickable components claim the same key", async () => {
    await expect(
      patchScene(sceneId, {
        fields: {},
        components: [
          { id: "component-a", type: "box", clickable: true, keyBinding: "Q" },
          { id: "component-b", type: "box", clickable: true, keyBinding: "Q" },
        ],
        deletedComponentIds: [],
      })
    ).rejects.toThrow(/claimed by more than one component/);

    const scene = await Scene.findById(sceneId);
    expect(
      scene.components.find((c) => c.id === "component-a").keyBinding
    ).toBeUndefined();
  });

  it("rejects a component key binding that collides with the direct link's default keys", async () => {
    await expect(
      patchScene(
        sceneId,
        {
          fields: { directLink: otherSceneId },
          components: [
            {
              id: "component-a",
              type: "box",
              clickable: true,
              keyBinding: "SPACE",
            },
          ],
          deletedComponentIds: [],
        },
        scenarioId
      )
    ).rejects.toThrow(/direct link/);
  });

  it("rejects a colliding key binding against a direct link already saved on the scene", async () => {
    await patchScene(
      sceneId,
      {
        fields: { directLink: otherSceneId },
        components: [],
        deletedComponentIds: [],
      },
      scenarioId
    );

    await expect(
      patchScene(
        sceneId,
        {
          fields: {},
          components: [
            {
              id: "component-a",
              type: "box",
              clickable: true,
              keyBinding: "ARROWRIGHT",
            },
          ],
          deletedComponentIds: [],
        },
        scenarioId
      )
    ).rejects.toThrow(/direct link/);
  });

  it("allows a component to keep its own key binding across an unrelated patch", async () => {
    await patchScene(sceneId, {
      fields: {},
      components: [
        { id: "component-a", type: "box", clickable: true, keyBinding: "Q" },
      ],
      deletedComponentIds: [],
    });

    await patchScene(sceneId, {
      fields: {},
      components: [
        {
          id: "component-a",
          type: "box",
          clickable: true,
          keyBinding: "Q",
          bounds: { verts: [{ x: 1, y: 1 }] },
        },
      ],
      deletedComponentIds: [],
    });

    const updatedScene = await Scene.findById(sceneId);
    expect(
      updatedScene.components.find((c) => c.id === "component-a").keyBinding
    ).toBe("Q");
  });

  it("rejects direct links that reference a scene outside the current scenario", async () => {
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
        directLink: otherScene._id,
        components: [],
      })
    ).rejects.toMatchObject({ status: 400 });
  });

  it("rejects createScene for an unknown scenario parent and increments file refs for created scenes", async () => {
    const missingScenarioId = new mongoose.Types.ObjectId().toString();
    await expect(
      createScene(missingScenarioId, {
        name: "Missing parent",
        components: [],
        directLink: null,
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
      directLink: null,
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

  it("covers null direct links, not-found deletes, and scene retrieval edge cases", async () => {
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
      directLink: null,
    });

    expect(await retrieveScene(newScene._id.toString())).toMatchObject({
      name: "Fresh scene",
    });

    await expect(
      createScene(linkScenario._id.toString(), {
        name: "Bad link",
        directLink: new mongoose.Types.ObjectId(),
        components: [],
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

    let updatedBackgroundScene = await Scene.findById(sceneId).lean();
    expect(updatedBackgroundScene.background).toMatchObject({
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

    updatedBackgroundScene = await Scene.findById(sceneId).lean();
    expect(updatedBackgroundScene.background).toMatchObject({
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
});

describe("Scene DAO deleteScene tests", () => {
  useMongoMemoryServer();

  const sceneAId = new mongoose.Types.ObjectId("000000000000000000000011");
  const sceneBId = new mongoose.Types.ObjectId("000000000000000000000012");
  const sceneCId = new mongoose.Types.ObjectId("000000000000000000000013");
  const scenarioId = new mongoose.Types.ObjectId("000000000000000000000098");

  beforeEach(async () => {
    await Scene.create({
      _id: sceneAId,
      name: "Scene A",
      components: [
        {
          id: "link-only",
          type: "box",
          clickable: true,
          nextScene: sceneBId.toString(),
          keyBinding: "Q",
          showKeyHint: true,
        },
        {
          id: "link-and-state",
          type: "box",
          clickable: true,
          nextScene: sceneBId.toString(),
          keyBinding: "W",
          stateOperations: [{ type: "SET_FLAG", flag: "visited" }],
        },
        {
          id: "unrelated",
          type: "box",
          clickable: true,
          nextScene: sceneCId.toString(),
          keyBinding: "E",
        },
      ],
    });
    await Scene.create({ _id: sceneBId, name: "Scene B", components: [] });
    await Scene.create({ _id: sceneCId, name: "Scene C", components: [] });
    await Scenario.create({
      _id: scenarioId,
      name: "Test Scenario",
      uid: "test-uid",
      scenes: [sceneAId, sceneBId, sceneCId],
    });
  });

  it("clears nextScene and the key binding for a component with no other action, when the linked scene is deleted", async () => {
    await deleteScene(scenarioId, sceneBId);

    const sceneA = await Scene.findById(sceneAId);
    const component = sceneA.components.find((c) => c.id === "link-only");

    expect(component.nextScene).toBeNull();
    expect(component.keyBinding).toBeNull();
    expect(component.showKeyHint).toBe(false);
  });

  it("clears nextScene but keeps the key binding for a component that still has state operations", async () => {
    await deleteScene(scenarioId, sceneBId);

    const sceneA = await Scene.findById(sceneAId);
    const component = sceneA.components.find((c) => c.id === "link-and-state");

    expect(component.nextScene).toBeNull();
    expect(component.keyBinding).toBe("W");
  });

  it("leaves components linked to a different, still-existing scene untouched", async () => {
    await deleteScene(scenarioId, sceneBId);

    const sceneA = await Scene.findById(sceneAId);
    const component = sceneA.components.find((c) => c.id === "unrelated");

    expect(component.nextScene).toBe(sceneCId.toString());
    expect(component.keyBinding).toBe("E");
  });

  it("clears the direct link and its key on scenes that direct-linked to the deleted scene", async () => {
    await Scene.updateOne(
      { _id: sceneCId },
      { $set: { directLink: sceneBId, directLinkKey: "R" } }
    );

    await deleteScene(scenarioId, sceneBId);

    const sceneC = await Scene.findById(sceneCId);
    expect(sceneC.directLink).toBeNull();
    expect(sceneC.directLinkKey).toBeNull();
  });
});
