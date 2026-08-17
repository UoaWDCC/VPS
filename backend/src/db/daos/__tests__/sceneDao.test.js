import { describe, beforeEach, it, expect } from "@jest/globals";

import mongoose from "mongoose";

import Scene from "../../models/scene.js";
import UploadedFile from "../../models/uploadedFile.js";
import { patchScene } from "../sceneDao.js";
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
          fileId: firstFile._id,
          href: firstFile.url,
          fit: "cover",
        },
      },
    });

    let updatedScene = await Scene.findById(sceneId).lean();
    expect(updatedScene.background).toMatchObject({
      fileId: firstFile._id,
      href: firstFile.url,
      fit: "cover",
    });
    expect((await UploadedFile.findById(firstFile._id)).refCount).toBe(1);

    await patchScene(sceneId, {
      fields: {
        background: {
          fileId: secondFile._id,
          href: secondFile.url,
          fit: "contain",
        },
      },
    });

    expect((await UploadedFile.findById(firstFile._id)).refCount).toBe(0);
    expect((await UploadedFile.findById(secondFile._id)).refCount).toBe(1);

    await patchScene(sceneId, { fields: { background: null } });

    updatedScene = await Scene.findById(sceneId).lean();
    expect(updatedScene.background).toBeNull();
    expect((await UploadedFile.findById(secondFile._id)).refCount).toBe(0);
  });
});
