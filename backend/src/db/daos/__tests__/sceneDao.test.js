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
    ];

    for (const background of invalidBackgrounds) {
      await expect(
        patchScene(sceneId, { fields: { background } })
      ).rejects.toThrow();
    }

    expect((await Scene.findById(sceneId).lean()).background).toBeNull();
  });

  it("keeps background reference counts consistent across concurrent patches", async () => {
    const files = await UploadedFile.create(
      ["first.png", "second.png", "third.png"].map((name) => ({
        name,
        type: "image",
        path: `images/${name}`,
        url: `https://example.com/${name}`,
        contentType: "image/png",
        size: 100,
        uploaderUid: "test-user",
        scenarioId: new mongoose.Types.ObjectId(),
      }))
    );

    const backgroundFor = (file) => ({
      kind: "image",
      fileId: file._id,
      href: file.url,
      fit: "cover",
    });

    await patchScene(sceneId, {
      fields: { background: backgroundFor(files[0]) },
    });

    await Promise.all([
      patchScene(sceneId, {
        fields: { background: backgroundFor(files[1]) },
      }),
      patchScene(sceneId, {
        fields: { background: backgroundFor(files[2]) },
      }),
    ]);

    const [scene, storedFiles] = await Promise.all([
      Scene.findById(sceneId).lean(),
      UploadedFile.find({ _id: { $in: files.map((file) => file._id) } }).lean(),
    ]);
    const finalFileId = scene.background.fileId.toString();

    expect(finalFileId).not.toBe(files[0]._id.toString());
    expect(
      storedFiles.find((file) => file._id.equals(files[0]._id)).refCount
    ).toBe(0);
    expect(storedFiles.reduce((sum, file) => sum + file.refCount, 0)).toBe(1);
    expect(
      storedFiles.find((file) => file._id.toString() === finalFileId).refCount
    ).toBe(1);
  });
});
