import { beforeEach, describe, expect, it } from "@jest/globals";
import mongoose from "mongoose";

import UploadedFile from "../../models/uploadedFile.js";
import { useMongoMemoryServer } from "../../../test/testSetup.js";
import {
  applyReferenceDelta,
  applyReferenceDeltas,
  retrieveFile,
  retrieveFiles,
} from "../fileDao.js";

describe("fileDao", () => {
  useMongoMemoryServer();

  beforeEach(async () => {
    await UploadedFile.deleteMany({});
  });

  it("applies reference deltas in batch and retrieves files by scenario and type", async () => {
    const scenarioId = new mongoose.Types.ObjectId();
    const imageA = await UploadedFile.create({
      name: "a.png",
      type: "image",
      path: "images/a.png",
      url: "https://example.com/a.png",
      contentType: "image/png",
      size: 12,
      uploaderUid: "uploader-1",
      scenarioId,
      refCount: 0,
    });
    const imageB = await UploadedFile.create({
      name: "b.png",
      type: "image",
      path: "images/b.png",
      url: "https://example.com/b.png",
      contentType: "image/png",
      size: 24,
      uploaderUid: "uploader-2",
      scenarioId,
      refCount: 1,
    });

    await applyReferenceDeltas(
      new Map([
        [imageA._id.toString(), 2],
        [imageB._id.toString(), -1],
      ])
    );

    const images = await retrieveFiles(scenarioId.toString(), "image");
    expect(images).toHaveLength(2);
    expect(images.map((file) => file._id.toString()).sort()).toEqual(
      [imageA._id.toString(), imageB._id.toString()].sort()
    );

    const refreshedA = await UploadedFile.findById(imageA._id);
    const refreshedB = await UploadedFile.findById(imageB._id);
    expect(refreshedA.refCount).toBe(2);
    expect(refreshedB.refCount).toBe(0);
  });

  it("applies a single delta and retrieves one file by scenario and id", async () => {
    const scenarioId = new mongoose.Types.ObjectId();
    const file = await UploadedFile.create({
      name: "doc.pdf",
      type: "document",
      path: "documents/doc.pdf",
      url: "https://example.com/doc.pdf",
      contentType: "application/pdf",
      size: 100,
      uploaderUid: "uploader-3",
      scenarioId,
      refCount: 1,
    });

    await applyReferenceDelta(file._id.toString(), 1);

    const foundFile = await retrieveFile(
      scenarioId.toString(),
      file._id.toString()
    );
    expect(foundFile).toMatchObject({
      _id: file._id,
      path: "documents/doc.pdf",
      type: "document",
    });

    const updated = await UploadedFile.findById(file._id);
    expect(updated.refCount).toBe(2);
  });

  it("rejects when a delta targets a file id that does not exist", async () => {
    const scenarioId = new mongoose.Types.ObjectId();
    const image = await UploadedFile.create({
      name: "exists.png",
      type: "image",
      path: "images/exists.png",
      url: "https://example.com/exists.png",
      contentType: "image/png",
      size: 12,
      uploaderUid: "uploader-5",
      scenarioId,
      refCount: 0,
    });

    const missingId = new mongoose.Types.ObjectId();

    await expect(
      applyReferenceDeltas(
        new Map([
          [image._id.toString(), 1],
          [missingId.toString(), 1],
        ])
      )
    ).rejects.toThrow("one or more file reference updates did not match");
  });

  it("returns early for empty or zero-value deltas", async () => {
    const scenarioId = new mongoose.Types.ObjectId();
    const file = await UploadedFile.create({
      name: "noop.txt",
      type: "document",
      path: "documents/noop.txt",
      url: "https://example.com/noop.txt",
      contentType: "text/plain",
      size: 14,
      uploaderUid: "uploader-4",
      scenarioId,
      refCount: 3,
    });

    await expect(applyReferenceDeltas(new Map())).resolves.toBeUndefined();
    await expect(
      applyReferenceDelta(file._id.toString(), 0)
    ).resolves.toBeUndefined();

    const refreshed = await UploadedFile.findById(file._id);
    expect(refreshed.refCount).toBe(3);
  });
});
