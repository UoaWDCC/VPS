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

import resourcesRouter from "../resources.js";
import CollectionGroup from "../../../db/models/CollectionGroup.js";
import Resource from "../../../db/models/resource.js";
import UploadedFile from "../../../db/models/uploadedFile.js";
import auth from "../../../middleware/firebaseAuth.js";
import scenarioAuth from "../../../middleware/scenarioAuth.js";
import errorHandler from "../../../middleware/errorHandler.js";
import { applyReferenceDelta } from "../../../db/daos/fileDao.js";
import { authHeaders } from "./testHelpers.js";
import {
  useMongoMemoryServer,
  useExpressServer,
} from "../../../test/testSetup.js";

jest.mock("../../../middleware/firebaseAuth");
jest.mock("../../../middleware/scenarioAuth");
jest.mock("firebase-admin");

auth.mockImplementation(async (req, res, next) => {
  req.body.uid = req.headers.authorization?.split(" ")[1];
  next();
});

scenarioAuth.mockImplementation(async (req, res, next) => {
  next();
});

describe("Resources API tests", () => {
  useMongoMemoryServer();
  const ctx = useExpressServer(() => {
    const app = express();
    app.use(express.json());
    app.use("/api/resources", resourcesRouter);
    app.use(errorHandler);
    return app;
  });

  const scenarioId = new mongoose.mongo.ObjectId("ccc000000000000000000001");
  let group;
  let uploadedFile;
  let resource;

  beforeEach(async () => {
    group = await CollectionGroup.create({
      scenarioId,
      name: "Test Group",
      order: 0,
    });

    uploadedFile = await UploadedFile.create({
      scenarioId,
      name: "test.png",
      type: "image",
      path: "files/fake-path.pdf",
      url: "https://firebasestorage.googleapis.com/fake-url",
      contentType: "image/png",
      size: 1024,
      uploaderUid: "user1",
      deletedAt: new Date(),
    });

    resource = await Resource.create({
      scenarioId,
      groupId: group._id,
      name: "image.png",
      fileId: uploadedFile._id,
    });

    await applyReferenceDelta(uploadedFile._id, 1);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // --- Create resource ---

  it("POST /resources/:scenarioId creates a Resource document", async () => {
    const response = await axios.post(
      `http://localhost:${ctx.port}/api/resources/${scenarioId}`,
      {
        groupId: group._id.toString(),
        name: "second.png",
        fileId: uploadedFile._id.toString(),
      },
      authHeaders("user1")
    );

    expect(response.status).toBe(201);
    expect(response.data.name).toBe("second.png");
    expect(response.data.stateConditionals).toHaveLength(0);
    expect(response.data.fileId._id).toBe(uploadedFile._id.toString());
    expect(response.data.fileId.url).toBe(uploadedFile.url);

    const dbResource = await Resource.findById(response.data._id);
    expect(dbResource).not.toBeNull();

    const dbFile = await UploadedFile.findById(uploadedFile._id);
    expect(dbFile.refCount).toBe(2);
  });

  it("POST /resources/:scenarioId returns 400 when required fields are missing", async () => {
    await expect(
      axios.post(
        `http://localhost:${ctx.port}/api/resources/${scenarioId}`,
        { groupId: group._id.toString() },
        authHeaders("user1")
      )
    ).rejects.toMatchObject({ response: { status: 400 } });
  });

  it("POST /resources/:scenarioId returns 404 when group does not belong to scenario", async () => {
    const otherScenarioId = new mongoose.mongo.ObjectId(
      "ddd000000000000000000001"
    );

    await expect(
      axios.post(
        `http://localhost:${ctx.port}/api/resources/${otherScenarioId}`,
        {
          groupId: group._id.toString(),
          name: "second.png",
          fileId: uploadedFile._id.toString(),
        },
        authHeaders("user1")
      )
    ).rejects.toMatchObject({ response: { status: 404 } });
  });

  // --- Delete resource ---

  it("DELETE /resources/:scenarioId/:resourceId deletes the Resource and decrements the file reference count", async () => {
    const response = await axios.delete(
      `http://localhost:${ctx.port}/api/resources/${scenarioId}/${resource._id}`,
      authHeaders("user1")
    );
    expect(response.status).toBe(204);

    const dbResource = await Resource.findById(resource._id);
    expect(dbResource).toBeNull();

    const dbFile = await UploadedFile.findById(uploadedFile._id);
    expect(dbFile.refCount).toBe(0);
    expect(dbFile.deletedAt).toBeInstanceOf(Date);
  });

  it("DELETE /resources/:scenarioId/:resourceId returns 404 when resource not found", async () => {
    await expect(
      axios.delete(
        `http://localhost:${ctx.port}/api/resources/${scenarioId}/000000000000000000000099`,
        authHeaders("user1")
      )
    ).rejects.toMatchObject({ response: { status: 404 } });
  });

  // --- State conditionals ---

  it("POST /resources/:scenarioId/:resourceId/conditionals adds a state conditional", async () => {
    const conditional = {
      stateVariableId: "var-1",
      comparator: "=",
      value: "open",
    };

    const response = await axios.post(
      `http://localhost:${ctx.port}/api/resources/${scenarioId}/${resource._id}/conditionals`,
      { stateConditional: conditional },
      authHeaders("user1")
    );

    expect(response.status).toBe(200);
    expect(response.data.stateConditionals).toHaveLength(1);
    expect(response.data.stateConditionals[0].stateVariableId).toBe("var-1");
  });

  it("POST /resources/:scenarioId/:resourceId/conditionals returns 404 for unknown resource", async () => {
    await expect(
      axios.post(
        `http://localhost:${ctx.port}/api/resources/${scenarioId}/000000000000000000000099/conditionals`,
        {
          stateConditional: { stateVariableId: "x", comparator: "=", value: 1 },
        },
        authHeaders("user1")
      )
    ).rejects.toMatchObject({ response: { status: 404 } });
  });

  it("PUT /resources/:scenarioId/:resourceId/conditionals updates an existing state conditional", async () => {
    const addResp = await axios.post(
      `http://localhost:${ctx.port}/api/resources/${scenarioId}/${resource._id}/conditionals`,
      {
        stateConditional: {
          stateVariableId: "var-1",
          comparator: "=",
          value: "old",
        },
      },
      authHeaders("user1")
    );
    const addedId = addResp.data.stateConditionals[0]._id;

    const response = await axios.put(
      `http://localhost:${ctx.port}/api/resources/${scenarioId}/${resource._id}/conditionals`,
      {
        stateConditional: {
          _id: addedId,
          stateVariableId: "var-1",
          comparator: "!=",
          value: "new",
        },
      },
      authHeaders("user1")
    );

    expect(response.status).toBe(200);
    expect(response.data.stateConditionals[0].comparator).toBe("!=");
    expect(response.data.stateConditionals[0].value).toBe("new");
  });

  it("PUT /resources/:scenarioId/:resourceId/conditionals returns 404 when resource not found", async () => {
    await expect(
      axios.put(
        `http://localhost:${ctx.port}/api/resources/${scenarioId}/000000000000000000000099/conditionals`,
        {
          stateConditional: {
            _id: new mongoose.mongo.ObjectId(),
            stateVariableId: "var-1",
            comparator: "=",
            value: "x",
          },
        },
        authHeaders("user1")
      )
    ).rejects.toMatchObject({ response: { status: 404 } });
  });

  it("DELETE /resources/:scenarioId/:resourceId/conditionals/:conditionalId removes a conditional", async () => {
    const addResp = await axios.post(
      `http://localhost:${ctx.port}/api/resources/${scenarioId}/${resource._id}/conditionals`,
      {
        stateConditional: {
          stateVariableId: "var-1",
          comparator: "=",
          value: "x",
        },
      },
      authHeaders("user1")
    );
    const conditionalId = addResp.data.stateConditionals[0]._id;

    const response = await axios.delete(
      `http://localhost:${ctx.port}/api/resources/${scenarioId}/${resource._id}/conditionals/${conditionalId}`,
      authHeaders("user1")
    );

    expect(response.status).toBe(200);
    expect(response.data.stateConditionals).toHaveLength(0);
  });

  it("DELETE /resources/:scenarioId/:resourceId/conditionals/:conditionalId returns 404 for non-existent resource", async () => {
    await expect(
      axios.delete(
        `http://localhost:${ctx.port}/api/resources/${scenarioId}/000000000000000000000099/conditionals/000000000000000000000099`,
        authHeaders("user1")
      )
    ).rejects.toMatchObject({ response: { status: 404 } });
  });
});
