import {
  jest,
  describe,
  beforeEach,
  afterEach,
  it,
  expect,
} from "@jest/globals";
import express from "express";
import mongoose from "mongoose";
import axios from "axios";
import FormData from "form-data";

import filesRouter from "../files.js";
import UploadedFile from "../../../db/models/uploadedFile.js";
import auth from "../../../middleware/firebaseAuth.js";
import scenarioAuth from "../../../middleware/scenarioAuth.js";
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

// NOTE: sets both req.uid (used directly by files.js) and req.body.uid
// so the mock behaves consistently regardless of which the handler reads
auth.mockImplementation(async (req, res, next) => {
  const uid = req.headers.authorization?.split(" ")[1];
  req.uid = uid;
  req.body.uid = uid;
  next();
});

scenarioAuth.mockImplementation(async (req, res, next) => next());

uploadFile.mockImplementation(async (buffer, mimetype) => ({
  path: `files/fake-path-${mimetype.replace("/", "-")}`,
  url: "https://firebasestorage.googleapis.com/fake-url",
}));

describe("Files API tests", () => {
  useMongoMemoryServer();
  const ctx = useExpressServer(() => {
    const app = express();
    app.use(express.json());
    app.use("/api/files", filesRouter);
    app.use(errorHandler);
    return app;
  });

  const scenarioId = new mongoose.mongo.ObjectId("ccc000000000000000000001");
  let imageFile;
  let documentFile;

  beforeEach(async () => {
    imageFile = await UploadedFile.create({
      scenarioId,
      name: "existing-image.png",
      type: "image",
      path: "files/existing-image.png",
      url: "https://firebasestorage.googleapis.com/existing-image",
      contentType: "image/png",
      size: 2048,
      uploaderUid: "user1",
      refCount: 1,
    });

    documentFile = await UploadedFile.create({
      scenarioId,
      name: "existing-doc.pdf",
      type: "document",
      path: "files/existing-doc.pdf",
      url: "https://firebasestorage.googleapis.com/existing-doc",
      contentType: "application/pdf",
      size: 4096,
      uploaderUid: "user1",
      refCount: 1,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // --- Upload ---

  it("POST /files/:scenarioId uploads an image and persists it", async () => {
    const form = new FormData();
    form.append("file", Buffer.from("fake-image-data"), {
      filename: "upload.png",
      contentType: "image/png",
    });

    const response = await axios.post(
      `http://localhost:${ctx.port}/api/files/${scenarioId}`,
      form,
      {
        headers: { ...form.getHeaders(), Authorization: "Bearer user1" },
      }
    );

    expect(response.status).toBe(201);
    expect(response.data.name).toBe("upload.png");
    expect(response.data.type).toBe("image");
    expect(response.data.contentType).toBe("image/png");
    expect(response.data.uploaderUid).toBe("user1");
    expect(uploadFile).toHaveBeenCalledTimes(1);

    const dbFile = await UploadedFile.findById(response.data._id);
    expect(dbFile).not.toBeNull();
    expect(dbFile.path).toBe("files/fake-path-image-png");
    // marked as orphaned until a resource references it
    expect(dbFile.orphanedAt).toBeInstanceOf(Date);
  });

  it("POST /files/:scenarioId infers type from mimetype (audio)", async () => {
    const form = new FormData();
    form.append("file", Buffer.from("fake-audio-data"), {
      filename: "clip.mp3",
      contentType: "audio/mpeg",
    });

    const response = await axios.post(
      `http://localhost:${ctx.port}/api/files/${scenarioId}`,
      form,
      { headers: { ...form.getHeaders(), Authorization: "Bearer user1" } }
    );

    expect(response.status).toBe(201);
    expect(response.data.type).toBe("audio");
  });

  it("POST /files/:scenarioId infers type from mimetype (document fallback)", async () => {
    const form = new FormData();
    form.append("file", Buffer.from("%PDF-fake"), {
      filename: "doc.pdf",
      contentType: "application/pdf",
    });

    const response = await axios.post(
      `http://localhost:${ctx.port}/api/files/${scenarioId}`,
      form,
      { headers: { ...form.getHeaders(), Authorization: "Bearer user1" } }
    );

    expect(response.status).toBe(201);
    expect(response.data.type).toBe("document");
  });

  it("POST /files/:scenarioId returns 400 when no file is provided", async () => {
    const form = new FormData();
    form.append("note", "no file attached");

    await expect(
      axios.post(`http://localhost:${ctx.port}/api/files/${scenarioId}`, form, {
        headers: { ...form.getHeaders(), Authorization: "Bearer user1" },
      })
    ).rejects.toMatchObject({ response: { status: 400 } });
  });

  it("POST /files/:scenarioId returns 400 when no valid form is provided", async () => {
    const form = new FormData();

    await expect(
      axios.post(`http://localhost:${ctx.port}/api/files/${scenarioId}`, form, {
        headers: { ...form.getHeaders(), Authorization: "Bearer user1" },
      })
    ).rejects.toMatchObject({ response: { status: 400 } });
  });

  it("POST /files/:scenarioId returns 415 for an unsupported mimetype", async () => {
    const form = new FormData();
    form.append("file", Buffer.from("fake-binary-data"), {
      filename: "malware.exe",
      contentType: "application/x-msdownload",
    });

    await expect(
      axios.post(`http://localhost:${ctx.port}/api/files/${scenarioId}`, form, {
        headers: { ...form.getHeaders(), Authorization: "Bearer user1" },
      })
    ).rejects.toMatchObject({ response: { status: 415 } });

    expect(uploadFile).not.toHaveBeenCalled();
  });

  // NOTE: MAX_FILE_SIZE_MB is set to a small value (see jest.setup.env.js)
  it("POST /files/:scenarioId returns 413 when file exceeds the configured size limit", async () => {
    const form = new FormData();
    form.append("file", Buffer.alloc(2048, "a"), {
      filename: "too-big.png",
      contentType: "image/png",
    });

    await expect(
      axios.post(`http://localhost:${ctx.port}/api/files/${scenarioId}`, form, {
        headers: { ...form.getHeaders(), Authorization: "Bearer user1" },
      })
    ).rejects.toMatchObject({ response: { status: 413 } });

    expect(uploadFile).not.toHaveBeenCalled();
  });

  it("POST /files/:scenarioId deletes the uploaded blob when UploadedFile.create fails", async () => {
    const dbError = new Error("simulated db failure");
    const createSpy = jest
      .spyOn(UploadedFile, "create")
      .mockRejectedValueOnce(dbError);

    const form = new FormData();
    form.append("file", Buffer.from("fake-image-data"), {
      filename: "upload.png",
      contentType: "image/png",
    });

    await expect(
      axios.post(`http://localhost:${ctx.port}/api/files/${scenarioId}`, form, {
        headers: { ...form.getHeaders(), Authorization: "Bearer user1" },
      })
    ).rejects.toMatchObject({ response: { status: 500 } });

    expect(uploadFile).toHaveBeenCalledTimes(1);
    expect(deleteFile).toHaveBeenCalledTimes(1);
    expect(deleteFile).toHaveBeenCalledWith("files/fake-path-image-png");

    createSpy.mockRestore();
  });

  // --- Retrieve image list ---

  it("GET /files/:scenarioId/image returns only image-type files for the scenario", async () => {
    const response = await axios.get(
      `http://localhost:${ctx.port}/api/files/${scenarioId}/image`,
      authHeaders("user1")
    );

    expect(response.status).toBe(200);
    expect(response.data).toHaveLength(1);
    expect(response.data[0]._id).toBe(imageFile._id.toString());
    expect(response.data[0].type).toBe("image");
  });

  it("GET /files/:scenarioId/images returns an empty array when scenario has no images", async () => {
    const otherScenarioId = new mongoose.mongo.ObjectId(
      "ddd000000000000000000001"
    );

    const response = await axios.get(
      `http://localhost:${ctx.port}/api/files/${otherScenarioId}/images`,
      authHeaders("user1")
    );

    expect(response.status).toBe(200);
    expect(response.data).toEqual([]);
  });

  // --- Retrieve single file ---

  it("GET /files/:scenarioId/:fileId retrieves a single file", async () => {
    const response = await axios.get(
      `http://localhost:${ctx.port}/api/files/${scenarioId}/${documentFile._id}`,
      authHeaders("user1")
    );

    expect(response.status).toBe(200);
    expect(response.data._id).toBe(documentFile._id.toString());
    expect(response.data.name).toBe("existing-doc.pdf");
  });

  it("GET /files/:scenarioId/:fileId returns 404 when file not found", async () => {
    await expect(
      axios.get(
        `http://localhost:${ctx.port}/api/files/${scenarioId}/000000000000000000000099`,
        authHeaders("user1")
      )
    ).rejects.toMatchObject({ response: { status: 404 } });
  });

  it("GET /files/:scenarioId/:fileId returns 404 when file belongs to a different scenario", async () => {
    const otherScenarioId = new mongoose.mongo.ObjectId(
      "ddd000000000000000000001"
    );

    await expect(
      axios.get(
        `http://localhost:${ctx.port}/api/files/${otherScenarioId}/${documentFile._id}`,
        authHeaders("user1")
      )
    ).rejects.toMatchObject({ response: { status: 404 } });
  });
});
