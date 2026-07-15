import { jest, describe, beforeEach, it, expect } from "@jest/globals";

import { v4 as uuidv4 } from "uuid";
import { getBucket } from "../firebase.js";
import { uploadFile } from "../storage.js";

jest.mock("uuid");
jest.mock("firebase-admin");
jest.mock("../firebase.js");

describe("uploadFile", () => {
  const DOWNLOAD_TOKEN = "11111111-1111-1111-1111-111111111111";
  const UNIQUE_FILENAME = "22222222-2222-2222-2222-222222222222";
  const BUCKET_NAME = "test-bucket.appspot.com";

  let mockFile;
  let mockBucket;

  beforeEach(() => {
    jest.clearAllMocks();

    // uploadFile calls uuidv4() twice: once for the download token, once
    // for the unique filename
    uuidv4
      .mockReturnValueOnce(DOWNLOAD_TOKEN)
      .mockReturnValueOnce(UNIQUE_FILENAME);

    mockFile = {
      name: `files/${UNIQUE_FILENAME}`,
      save: jest.fn().mockResolvedValue(undefined),
    };

    mockBucket = {
      name: BUCKET_NAME,
      file: jest.fn().mockReturnValue(mockFile),
    };

    getBucket.mockReturnValue(mockBucket);
  });

  it("throws when contentType is missing, without touching the bucket", async () => {
    await expect(uploadFile(Buffer.from("data"), undefined)).rejects.toThrow(
      "contentType is required"
    );

    expect(getBucket).not.toHaveBeenCalled();
  });

  it("saves the buffer under a unique path with the correct metadata", async () => {
    const buffer = Buffer.from("fake-image-data");

    await uploadFile(buffer, "image/png");

    expect(mockBucket.file).toHaveBeenCalledWith(`files/${UNIQUE_FILENAME}`);
    expect(mockFile.save).toHaveBeenCalledWith(buffer, {
      metadata: {
        contentType: "image/png",
        metadata: {
          firebaseStorageDownloadTokens: DOWNLOAD_TOKEN,
        },
      },
    });
  });

  it("returns the stored path and a correctly encoded public download URL", async () => {
    const result = await uploadFile(Buffer.from("data"), "image/png");

    expect(result.path).toBe(`files/${UNIQUE_FILENAME}`);

    // the "/" in "files/<uuid>" must be percent-encoded (%2F), not left
    // raw or double-encoded, or the resulting URL won't resolve
    const expectedUrl =
      `https://firebasestorage.googleapis.com/v0/b/${BUCKET_NAME}/o/` +
      `files%2F${UNIQUE_FILENAME}?alt=media&token=${DOWNLOAD_TOKEN}`;

    expect(result.url).toBe(expectedUrl);
  });

  it("wraps a storage failure in a generic 'upload failed' error", async () => {
    mockFile.save.mockRejectedValue(new Error("network timeout"));

    await expect(uploadFile(Buffer.from("data"), "image/png")).rejects.toThrow(
      "upload failed: network timeout"
    );
  });
});
