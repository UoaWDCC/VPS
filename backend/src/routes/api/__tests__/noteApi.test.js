import {
  jest,
  describe,
  beforeAll,
  beforeEach,
  afterEach,
  afterAll,
  it,
  expect,
} from "@jest/globals";

import { MongoMemoryServer } from "mongodb-memory-server";
import express from "express";
import mongoose from "mongoose";
import axios from "axios";
import routes from "../../index.js";
import Note from "../../../db/models/note.js";
import Group from "../../../db/models/group.js";
import auth from "../../../middleware/firebaseAuth.js";
import { authHeaders } from "./testHelpers.js";

jest.mock("../../../middleware/firebaseAuth");
jest.mock("firebase-admin");

auth.mockImplementation(async (req, res, next) => {
  req.body.uid = req.headers.authorization?.split(" ")[1];
  next();
});

describe("Note API tests", () => {
  let mongoServer;
  let server;
  let port;

  const userEmail = "doctor@example.com";
  const userRole = "doctor";

  let group;
  let note1;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    const app = express();
    app.use(express.json());
    app.use("/", routes);

    server = app.listen(0);
    port = server.address().port;
  });

  beforeEach(async () => {
    note1 = await Note.create({
      title: "Note 1",
      text: "Some text",
      role: userRole,
      date: new Date(),
    });

    group = await Group.create({
      users: [{ email: userEmail, name: "Doctor", role: userRole }],
      notes: { [userRole]: [note1._id.toString()] },
      path: [],
      scenarioId: "scenario-001",
      currentFlags: [],
    });
  });

  afterEach(async () => {
    await mongoose.connection.db.dropDatabase();
  });

  afterAll(async () => {
    server.close(async () => {
      await mongoose.disconnect();
      await mongoServer.stop();
    });
  });

  it("GET /note/retrieveAll/:groupId returns all notes for a group", async () => {
    const response = await axios.get(
      `http://localhost:${port}/api/note/retrieveAll/${group._id}`,
      authHeaders("user1")
    );
    expect(response.status).toBe(200);
    expect(response.data).toHaveLength(1);
    expect(response.data[0].title).toBe("Note 1");
    expect(response.data[0].text).toBe("Some text");
  });

  it("GET /note/retrieveAll/:groupId returns empty array for group with no notes", async () => {
    const emptyGroup = await Group.create({
      users: [],
      notes: {},
      path: [],
      scenarioId: "scenario-002",
      currentFlags: [],
    });

    const response = await axios.get(
      `http://localhost:${port}/api/note/retrieveAll/${emptyGroup._id}`,
      authHeaders("user1")
    );
    expect(response.status).toBe(200);
    expect(response.data).toHaveLength(0);
  });

  it("GET /note/retrieve/:noteId returns a specific note", async () => {
    const response = await axios.get(
      `http://localhost:${port}/api/note/retrieve/${note1._id}`,
      authHeaders("user1")
    );
    expect(response.status).toBe(200);
    expect(response.data._id).toBe(note1._id.toString());
    expect(response.data.title).toBe("Note 1");
  });

  it("POST /note/ creates a note for a user in the group", async () => {
    const response = await axios.post(
      `http://localhost:${port}/api/note/`,
      {
        groupId: group._id.toString(),
        title: "New Note",
        email: userEmail,
      },
      authHeaders("user1")
    );
    expect(response.status).toBe(200);
    expect(response.data).toBe("note created");

    // Verify note was persisted
    const notes = await Note.find({ title: "New Note" });
    expect(notes).toHaveLength(1);
    expect(notes[0].role).toBe(userRole);
  });

  it("POST /note/ does nothing silently when user is not in group", async () => {
    // User not in the group — createNote returns null but route still responds 200
    const response = await axios.post(
      `http://localhost:${port}/api/note/`,
      {
        groupId: group._id.toString(),
        title: "Ghost Note",
        email: "outsider@example.com",
      },
      authHeaders("user1")
    );
    expect(response.status).toBe(200);
    expect(response.data).toBe("note created");

    const notes = await Note.find({ title: "Ghost Note" });
    expect(notes).toHaveLength(0);
  });

  it("PUT /note/update updates a note's title and text", async () => {
    const response = await axios.put(
      `http://localhost:${port}/api/note/update`,
      {
        noteId: note1._id.toString(),
        title: "Updated Title",
        text: "Updated text",
        groupId: group._id.toString(),
        email: userEmail,
      },
      authHeaders("user1")
    );
    expect(response.status).toBe(200);
    expect(response.data).toBe("note updated");

    const dbNote = await Note.findById(note1._id).lean();
    expect(dbNote.title).toBe("Updated Title");
    expect(dbNote.text).toBe("Updated text");
  });

  it("DELETE /note/delete removes the note and its reference from the group", async () => {
    const response = await axios.delete(
      `http://localhost:${port}/api/note/delete`,
      {
        ...authHeaders("user1"),
        data: {
          noteId: note1._id.toString(),
          groupId: group._id.toString(),
          email: userEmail,
        },
      }
    );
    expect(response.status).toBe(200);
    expect(response.data).toBe("note deleted");

    const dbNote = await Note.findById(note1._id);
    expect(dbNote).toBeNull();

    const dbGroup = await Group.findById(group._id).lean();
    expect(dbGroup.notes[userRole] ?? []).not.toContain(note1._id.toString());
  });
});
