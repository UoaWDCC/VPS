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
      },
      components: [],
      deletedComponentIds: [],
    });

    const updatedScene = await Scene.findById(sceneId);

    expect(updatedScene.name).toBe("Updated Scene Name");
    expect(updatedScene.roles).toEqual(["patient"]);
    expect(updatedScene.time).toBe(120);
    expect(updatedScene.components).toHaveLength(3);
  });

  it("rejects direct links that reference a scene outside the current scenario", async () => {
    const otherScenario = await Scenario.create({
      name: "Other scenario",
      uid: "author-2",
      scenes: [new mongoose.Types.ObjectId()],
    });

    const otherScene = await Scene.create({
      _id: new mongoose.Types.ObjectId("000000000000000000000002"),
      name: "Other Scene",
      components: [],
    });

    await Scenario.updateOne(
      { _id: otherScenario._id },
      { $push: { scenes: otherScene._id } }
    );

    await expect(
      createScene(
        new mongoose.Types.ObjectId("000000000000000000000003").toString(),
        {
          name: "Linked scene",
          directLink: otherScene._id,
          components: [],
        }
      )
    ).rejects.toMatchObject({ status: 400 });
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
});
