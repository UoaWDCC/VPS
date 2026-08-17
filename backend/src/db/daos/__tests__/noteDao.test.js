import { beforeEach, describe, expect, it } from "@jest/globals";

import Group from "../../models/group.js";
import Note from "../../models/note.js";
import { useMongoMemoryServer } from "../../../test/testSetup.js";
import { HttpError } from "../../../util/error.js";
import {
  createNote,
  deleteNote,
  hasNoteInGroup,
  retrieveNote,
  retrieveNoteList,
  updateNote,
} from "../noteDao.js";

describe("noteDao", () => {
  useMongoMemoryServer();

  beforeEach(async () => {
    await Group.deleteMany({});
    await Note.deleteMany({});
  });

  it("creates, lists, and reads a note within a group", async () => {
    const group = await Group.create({
      scenarioId: "scenario-note",
      users: [{ email: "alice@example.com" }],
      notes: { doctor: [] },
      path: [],
    });

    const created = await createNote(
      group._id.toString(),
      "Title",
      "doctor",
      "Text"
    );
    const noteList = await retrieveNoteList(group._id.toString());
    const found = await retrieveNote(created._id.toString());

    expect(created).toMatchObject({
      title: "Title",
      role: "doctor",
      text: "Text",
    });
    expect(noteList).toHaveLength(1);
    expect(found).toMatchObject({ title: "Title", role: "doctor" });
    expect(hasNoteInGroup(group.toObject(), created._id.toString())).toBe(
      false
    );
  });

  it("updates and deletes a note only for the matching role", async () => {
    const group = await Group.create({
      scenarioId: "scenario-note-2",
      users: [{ email: "alice@example.com" }],
      notes: { doctor: [] },
      path: [],
    });

    const created = await createNote(
      group._id.toString(),
      "Old",
      "doctor",
      "Before"
    );

    await updateNote(
      created._id.toString(),
      {
        title: "New",
        text: "After",
        date: new Date("2024-01-01"),
      },
      "doctor"
    );

    const updated = await retrieveNote(created._id.toString());
    expect(updated).toMatchObject({ title: "New", text: "After" });

    await deleteNote(created._id.toString(), group._id.toString(), "doctor");
    const afterDelete = await retrieveNote(created._id.toString());
    expect(afterDelete).toBeNull();
  });

  it("throws HttpError when a note role does not match the caller", async () => {
    const group = await Group.create({
      scenarioId: "scenario-note-3",
      users: [{ email: "alice@example.com" }],
      notes: { doctor: [] },
      path: [],
    });

    const created = await createNote(
      group._id.toString(),
      "Locked",
      "doctor",
      "Text"
    );

    await expect(
      deleteNote(created._id.toString(), group._id.toString(), "nurse")
    ).rejects.toBeInstanceOf(HttpError);
  });
});
