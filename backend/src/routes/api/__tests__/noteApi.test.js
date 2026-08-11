import { jest, describe, beforeEach, it, expect } from "@jest/globals";

import express from "express";
import axios from "axios";
import routes from "../../index.js";
import Note from "../../../db/models/note.js";
import Group from "../../../db/models/group.js";
import User from "../../../db/models/user.js";
import auth from "../../../middleware/firebaseAuth.js";
import { authHeaders } from "./testHelpers.js";
import {
  useMongoMemoryServer,
  useExpressServer,
} from "../../../test/testSetup.js";

jest.mock("../../../middleware/firebaseAuth");
jest.mock("firebase-admin");

auth.mockImplementation(async (req, res, next) => {
  req.body.uid = req.headers.authorization?.split(" ")[1];
  next();
});

describe("Note API tests", () => {
  useMongoMemoryServer();
  const ctx = useExpressServer(() => {
    const app = express();
    app.use(express.json());
    app.use("/", routes);
    return app;
  });

  const userEmail = "doctor@example.com";
  const userRole = "doctor";

  let group;
  let note1;

  beforeEach(async () => {
    // The note routes resolve the caller's email from their uid, so the
    // authenticated user must exist and (to be a group member) share the
    // group member's email.
    await User.create({
      uid: "user1",
      name: "Doctor",
      email: userEmail,
      pictureURL: "http://example.com/doctor.png",
    });

    await User.create({
      uid: "outsider",
      name: "Outsider",
      email: "outsider@example.com",
      pictureURL: "http://example.com/outsider.png",
    });

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

  it("GET /group/:groupId/notes returns all notes for a group", async () => {
    const response = await axios.get(
      `http://localhost:${ctx.port}/api/group/${group._id}/notes`,
      authHeaders("user1")
    );
    expect(response.status).toBe(200);
    expect(response.data).toHaveLength(1);
    expect(response.data[0].title).toBe("Note 1");
    expect(response.data[0].text).toBe("Some text");
  });

  it("GET /group/:groupId/notes returns empty array for group with no notes", async () => {
    const emptyGroup = await Group.create({
      users: [{ email: userEmail, name: "Doctor", role: userRole }],
      notes: {},
      path: [],
      scenarioId: "scenario-002",
      currentFlags: [],
    });

    const response = await axios.get(
      `http://localhost:${ctx.port}/api/group/${emptyGroup._id}/notes`,
      authHeaders("user1")
    );
    expect(response.status).toBe(200);
    expect(response.data).toHaveLength(0);
  });

  it("GET /group/:groupId/notes/:noteId returns a specific note", async () => {
    const response = await axios.get(
      `http://localhost:${ctx.port}/api/group/${group._id}/notes/${note1._id}`,
      authHeaders("user1")
    );
    expect(response.status).toBe(200);
    expect(response.data._id).toBe(note1._id.toString());
    expect(response.data.title).toBe("Note 1");
  });

  it("POST /group/:groupId/notes creates a note for a user in the group", async () => {
    const response = await axios.post(
      `http://localhost:${ctx.port}/api/group/${group._id}/notes`,
      {
        title: "New Note",
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

  it("POST /group/:groupId/notes returns forbidden when user is not in group", async () => {
    // Authenticated as "outsider", whose email is not a group member —
    // the middleware rejects the request before any note is created.
    await expect(
      axios.post(
        `http://localhost:${ctx.port}/api/group/${group._id}/notes`,
        {
          title: "Ghost Note",
        },
        authHeaders("outsider")
      )
    ).rejects.toMatchObject({ response: { status: 403 } });

    const notes = await Note.find({ title: "Ghost Note" });
    expect(notes).toHaveLength(0);
  });

  it("PUT /group/:groupId/notes/:noteId updates a note's title and text", async () => {
    const response = await axios.put(
      `http://localhost:${ctx.port}/api/group/${group._id}/notes/${note1._id}`,
      {
        title: "Updated Title",
        text: "Updated text",
      },
      authHeaders("user1")
    );
    expect(response.status).toBe(200);
    expect(response.data).toBe("note updated");

    const dbNote = await Note.findById(note1._id).lean();
    expect(dbNote.title).toBe("Updated Title");
    expect(dbNote.text).toBe("Updated text");
  });

  it("DELETE /group/:groupId/notes/:noteId removes the note and its reference from the group", async () => {
    const response = await axios.delete(
      `http://localhost:${ctx.port}/api/group/${group._id}/notes/${note1._id}`,
      {
        ...authHeaders("user1"),
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
