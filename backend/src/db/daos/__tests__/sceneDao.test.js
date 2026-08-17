import { describe, beforeEach, it, expect } from "@jest/globals";

import mongoose from "mongoose";

import Scene from "../../models/scene.js";
import Scenario from "../../models/scenario.js";
import UploadedFile from "../../models/uploadedFile.js";
import { createScene, deleteScene, patchScene } from "../sceneDao.js";
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
});
