import { describe, beforeEach, it, expect } from "@jest/globals";

import mongoose from "mongoose";

import Scene from "../../models/scene.js";
import Scenario from "../../models/scenario.js";
import { patchScene, deleteScene } from "../sceneDao.js";
import { useMongoMemoryServer } from "../../../test/testSetup.js";

describe("Scene DAO patchScene tests", () => {
  useMongoMemoryServer();

  const sceneId = new mongoose.Types.ObjectId("000000000000000000000001");
  const otherSceneId = new mongoose.Types.ObjectId("000000000000000000000002");
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
});
