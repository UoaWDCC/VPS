import { jest, describe, beforeEach, it, expect } from "@jest/globals";
import express from "express";
import mongoose from "mongoose";
import axios from "axios";
import FormData from "form-data";

import assetsRouter from "../assets.js";
import Asset from "../../../db/models/asset.js";
import UploadedFile from "../../../db/models/uploadedFile.js";
import auth from "../../../middleware/firebaseAuth.js";
import { isAuthor } from "../../../middleware/scenarioAuth.js";
import errorHandler from "../../../middleware/errorHandler.js";
import { uploadFile, deleteFile } from "../../../firebase/storage.js";

import { authHeaders } from "./testHelpers.js";
import {
  useMongoMemoryServer,
  useExpressServer,
} from "../../../test/testSetup.js";

jest.mock("../../../firebase/storage.js");
jest.mock("../../../middleware/firebaseAuth");
jest.mock("../../../middleware/scenarioAuth");
jest.mock("firebase-admin");

// sets both req.uid (read by the routes) and req.body.uid, like the real one
auth.mockImplementation(async (req, res, next) => {
  const uid = req.headers.authorization?.split(" ")[1];
  req.uid = uid;
  req.body.uid = uid;
  next();
});

// "author-1" and "author-2" can edit the scenarios used below
isAuthor.mockImplementation(async (scenarioId, uid) =>
  ["author-1", "author-2"].includes(uid)
);

let storedCount = 0;
uploadFile.mockImplementation(async (buffer, mimetype) => ({
  path: `files/stored-${++storedCount}`,
  url: `https://storage.example/${storedCount}?type=${mimetype}`,
}));

describe("Assets API tests", () => {
  useMongoMemoryServer();
  const ctx = useExpressServer(() => {
    const app = express();
    app.use(express.json());
    app.use("/api/assets", assetsRouter);
    app.use(errorHandler);
    return app;
  });

  const url = (path = "") => `http://localhost:${ctx.port}/api/assets${path}`;
  const scenarioId = new mongoose.mongo.ObjectId("ccc000000000000000000001");
  const otherScenarioId = new mongoose.mongo.ObjectId(
    "ccc000000000000000000002"
  );

  const makeAsset = (overrides = {}) =>
    Asset.create({
      name: "heart.png",
      type: "image",
      tags: ["heart", "medical"],
      path: "files/heart",
      url: "https://storage.example/heart",
      contentType: "image/png",
      size: 1024,
      ownerUid: "author-1",
      ...overrides,
    });

  function uploadForm(
    { filename = "photo.png", contentType = "image/png", ...fields } = {},
    data = "fake-bytes"
  ) {
    const form = new FormData();
    form.append("file", Buffer.from(data), { filename, contentType });
    for (const [key, value] of Object.entries(fields)) form.append(key, value);
    return form;
  }

  const post = (form, uid = "author-1") =>
    axios.post(url(), form, {
      headers: { ...form.getHeaders(), Authorization: `Bearer ${uid}` },
    });

  beforeEach(() => {
    jest.clearAllMocks();
    storedCount = 0;
  });

  // --- upload ---

  it("POST /assets stores the file and records the asset for the caller", async () => {
    const response = await post(
      uploadForm({ tags: "Heart, #Medical , heart,  first aid " })
    );

    expect(response.status).toBe(201);
    expect(response.data).toMatchObject({
      name: "photo.png",
      type: "image",
      contentType: "image/png",
      ownerUid: "author-1",
      tags: ["heart", "medical", "first aid"],
    });
    expect(uploadFile).toHaveBeenCalledTimes(1);

    const stored = await Asset.findById(response.data._id);
    expect(stored.path).toBe("files/stored-1");
  });

  it("POST /assets works out the type from the mime type", async () => {
    const audio = await post(
      uploadForm({ filename: "beep.wav", contentType: "audio/wav" })
    );
    const document = await post(
      uploadForm({ filename: "guide.pdf", contentType: "application/pdf" })
    );
    expect(audio.data.type).toBe("audio");
    expect(document.data.type).toBe("document");
  });

  it("POST /assets uses a given name, else the file name", async () => {
    const named = await post(uploadForm({ name: "  My heart  " }));
    const unnamed = await post(uploadForm({ filename: "other.png" }));
    expect(named.data.name).toBe("My heart");
    expect(unnamed.data.name).toBe("other.png");
  });

  it("POST /assets keeps at most 10 tags", async () => {
    const tags = Array.from({ length: 15 }, (_, i) => `tag${i}`).join(",");
    const response = await post(uploadForm({ tags }));
    expect(response.data.tags).toHaveLength(10);
  });

  it("POST /assets cuts overlong tags to 30 characters", async () => {
    const response = await post(uploadForm({ tags: "a".repeat(50) }));
    expect(response.data.tags).toEqual(["a".repeat(30)]);
  });

  it("POST /assets rejects a file type that isn't allowed", async () => {
    await expect(
      post(
        uploadForm({
          filename: "run.exe",
          contentType: "application/x-msdownload",
        })
      )
    ).rejects.toMatchObject({ response: { status: 415 } });
    expect(uploadFile).not.toHaveBeenCalled();
  });

  it("POST /assets returns 400 when no file is sent", async () => {
    const form = new FormData();
    form.append("tags", "heart");
    await expect(post(form)).rejects.toMatchObject({
      response: { status: 400 },
    });
  });

  it("POST /assets removes the stored file if saving the asset fails", async () => {
    const original = Asset.create;
    Asset.create = jest.fn().mockRejectedValue(new Error("db down"));
    try {
      await expect(post(uploadForm())).rejects.toMatchObject({
        response: { status: 500 },
      });
      expect(deleteFile).toHaveBeenCalledWith("files/stored-1");
    } finally {
      Asset.create = original;
    }
  });

  // --- list ---

  describe("GET /assets", () => {
    beforeEach(async () => {
      await makeAsset({ name: "heart.png", tags: ["heart", "medical"] });
      await makeAsset({
        name: "Heart monitor",
        type: "audio",
        tags: ["beep", "monitor"],
        path: "files/monitor",
      });
      await makeAsset({
        name: "ward-guide.pdf",
        type: "document",
        tags: ["guide"],
        path: "files/guide",
      });
      await makeAsset({ name: "someone-elses.png", ownerUid: "author-2" });
    });

    const list = async (query = "", uid = "author-1") =>
      (await axios.get(url(query), authHeaders(uid))).data;

    it("returns only the caller's assets, newest first", async () => {
      const assets = await list();
      expect(assets.map((a) => a.name)).toEqual([
        "ward-guide.pdf",
        "Heart monitor",
        "heart.png",
      ]);
    });

    it("filters by type", async () => {
      const assets = await list("?type=audio");
      expect(assets.map((a) => a.name)).toEqual(["Heart monitor"]);
    });

    it("rejects an unknown type", async () => {
      await expect(list("?type=video")).rejects.toMatchObject({
        response: { status: 400 },
      });
    });

    it("filters by exact tag", async () => {
      const assets = await list("?tag=Medical");
      expect(assets.map((a) => a.name)).toEqual(["heart.png"]);
    });

    it("searches names and tags, ignoring case", async () => {
      const heart = await list("?q=HEART");
      expect(heart.map((a) => a.name)).toEqual(["Heart monitor", "heart.png"]);

      const byTag = await list("?q=guide");
      expect(byTag.map((a) => a.name)).toEqual(["ward-guide.pdf"]);
    });

    it("needs every search word to match", async () => {
      const assets = await list("?q=heart monitor");
      expect(assets.map((a) => a.name)).toEqual(["Heart monitor"]);
    });

    it("treats the search text literally, not as a pattern", async () => {
      expect(await list("?q=.*")).toEqual([]);
      expect(await list("?q=(")).toEqual([]);
    });

    it("limits the number of results", async () => {
      expect(await list("?limit=2")).toHaveLength(2);
    });
  });

  // --- update ---

  describe("PATCH /assets/:assetId", () => {
    const patch = (id, body, uid = "author-1") =>
      axios.patch(url(`/${id}`), body, authHeaders(uid));

    it("renames and retags", async () => {
      const asset = await makeAsset();
      const response = await patch(asset._id, {
        name: "  Red heart ",
        tags: ["Cardiac", "cardiac", "#red"],
      });
      expect(response.data.name).toBe("Red heart");
      expect(response.data.tags).toEqual(["cardiac", "red"]);

      const stored = await Asset.findById(asset._id);
      expect(stored.name).toBe("Red heart");
    });

    it("can clear the tags", async () => {
      const asset = await makeAsset();
      const response = await patch(asset._id, { tags: [] });
      expect(response.data.tags).toEqual([]);
    });

    it("rejects an empty name, bad tags, and an empty update", async () => {
      const asset = await makeAsset();
      for (const body of [{ name: "   " }, { tags: 5 }, {}]) {
        await expect(patch(asset._id, body)).rejects.toMatchObject({
          response: { status: 400 },
        });
      }
    });

    it("404s for an asset that isn't the caller's", async () => {
      const asset = await makeAsset({ ownerUid: "author-2" });
      await expect(
        patch(asset._id, { name: "mine now" })
      ).rejects.toMatchObject({ response: { status: 404 } });
      expect((await Asset.findById(asset._id)).name).toBe("heart.png");
    });

    it("400s for a malformed id", async () => {
      await expect(patch("nope", { name: "x" })).rejects.toMatchObject({
        response: { status: 400 },
      });
    });
  });

  // --- delete ---

  describe("DELETE /assets/:assetId", () => {
    const del = (id, uid = "author-1") =>
      axios.delete(url(`/${id}`), authHeaders(uid));

    it("removes the asset and its stored file when nothing uses it", async () => {
      const asset = await makeAsset();
      const response = await del(asset._id);

      expect(response.status).toBe(204);
      expect(await Asset.findById(asset._id)).toBeNull();
      expect(deleteFile).toHaveBeenCalledWith("files/heart");
    });

    it("keeps the stored file while a scenario still uses it", async () => {
      const asset = await makeAsset();
      const used = await UploadedFile.create({
        name: "heart.png",
        type: "image",
        path: asset.path,
        url: asset.url,
        contentType: "image/png",
        size: 1024,
        uploaderUid: "author-1",
        scenarioId,
        assetId: asset._id,
        refCount: 1,
      });

      const response = await del(asset._id);
      expect(response.status).toBe(204);
      expect(await Asset.findById(asset._id)).toBeNull();
      expect(deleteFile).not.toHaveBeenCalled();

      // the scenario's file lives on, no longer tied to a library entry
      const stillThere = await UploadedFile.findById(used._id);
      expect(stillThere).not.toBeNull();
      expect(stillThere.assetId).toBeNull();
    });

    it("still succeeds if the stored file can't be deleted", async () => {
      deleteFile.mockRejectedValueOnce(new Error("storage down"));
      const errorLog = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const asset = await makeAsset();

      const response = await del(asset._id);
      expect(response.status).toBe(204);
      expect(await Asset.findById(asset._id)).toBeNull();
      errorLog.mockRestore();
    });

    it("404s for an asset that isn't the caller's, and leaves it alone", async () => {
      const asset = await makeAsset({ ownerUid: "author-2" });
      await expect(del(asset._id)).rejects.toMatchObject({
        response: { status: 404 },
      });
      expect(await Asset.findById(asset._id)).not.toBeNull();
      expect(deleteFile).not.toHaveBeenCalled();
    });
  });

  // --- use in a scenario ---

  describe("POST /assets/:assetId/use", () => {
    const use = (id, body, uid = "author-1") =>
      axios.post(url(`/${id}/use`), body, authHeaders(uid));

    it("gives the scenario its own file pointing at the same stored object", async () => {
      const asset = await makeAsset();
      const response = await use(asset._id, { scenarioId });

      expect(response.status).toBe(201);
      expect(response.data).toMatchObject({
        name: "heart.png",
        type: "image",
        path: asset.path,
        url: asset.url,
        contentType: "image/png",
        scenarioId: scenarioId.toString(),
        assetId: asset._id.toString(),
        uploaderUid: "author-1",
      });

      const stored = await UploadedFile.findById(response.data._id);
      // unreferenced until a scene uses it, like any fresh upload
      expect(stored.orphanedAt).toBeInstanceOf(Date);
      expect(stored.refCount).toBe(0);
      expect(uploadFile).not.toHaveBeenCalled();
    });

    it("gives the same file back when asked again for the same scenario", async () => {
      const asset = await makeAsset();
      const first = await use(asset._id, { scenarioId });
      const second = await use(asset._id, { scenarioId });

      expect(second.status).toBe(200);
      expect(second.data._id).toBe(first.data._id);
      expect(await UploadedFile.countDocuments({ assetId: asset._id })).toBe(1);
    });

    it("gives a separate file for each scenario", async () => {
      const asset = await makeAsset();
      const first = await use(asset._id, { scenarioId });
      const second = await use(asset._id, { scenarioId: otherScenarioId });

      expect(second.data._id).not.toBe(first.data._id);
      expect(second.data.path).toBe(first.data.path);
    });

    it("refuses when the caller can't edit the scenario", async () => {
      const asset = await makeAsset({ ownerUid: "reader" });
      await expect(
        use(asset._id, { scenarioId }, "reader")
      ).rejects.toMatchObject({ response: { status: 401 } });
      expect(await UploadedFile.countDocuments()).toBe(0);
    });

    it("400s for a missing or malformed scenario id", async () => {
      const asset = await makeAsset();
      for (const body of [{}, { scenarioId: "nope" }]) {
        await expect(use(asset._id, body)).rejects.toMatchObject({
          response: { status: 400 },
        });
      }
    });

    it("404s for an asset that isn't the caller's", async () => {
      const asset = await makeAsset({ ownerUid: "author-2" });
      await expect(use(asset._id, { scenarioId })).rejects.toMatchObject({
        response: { status: 404 },
      });
    });
  });
});
