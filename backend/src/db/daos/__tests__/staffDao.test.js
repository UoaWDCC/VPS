import { beforeEach, describe, expect, it } from "@jest/globals";

import Staff from "../../models/staff.js";
import { useMongoMemoryServer } from "../../../test/testSetup.js";
import retrieveAuthorisedStaffList from "../staffDao.js";

describe("staffDao", () => {
  useMongoMemoryServer();

  beforeEach(async () => {
    await Staff.deleteMany({});
  });

  it("returns the staff rows for the provided firebase user id", async () => {
    await Staff.create({
      firebaseID: "firebase-staff-1",
      emailAddress: "staff@example.com",
    });
    await Staff.create({
      firebaseID: "firebase-staff-2",
      emailAddress: "other@example.com",
    });

    const staff = await retrieveAuthorisedStaffList("firebase-staff-1");
    expect(staff).toHaveLength(1);
    expect(staff[0]).toMatchObject({
      firebaseID: "firebase-staff-1",
      emailAddress: "staff@example.com",
    });
  });

  it("returns an empty array when no staff rows match", async () => {
    const staff = await retrieveAuthorisedStaffList("missing-user");
    expect(staff).toEqual([]);
  });
});
