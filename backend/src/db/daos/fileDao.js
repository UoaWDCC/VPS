import UploadedFile from "../models/uploadedFile.js";

/**
 * Applies reference count deltas to multiple file objects in bulk
 * @param {Map<string, number>} fileRefDeltas Map of file ID to delta to increment by
 * @returns {Promise<void>}
 */
export async function applyReferenceDeltas(fileRefDeltas) {
  if (fileRefDeltas.size === 0) return;

  const fileOperations = Array.from(fileRefDeltas.entries())
    .filter(([, delta]) => delta !== 0)
    .map(([fileId, delta]) => ({
      updateOne: {
        filter: { _id: fileId },
        update: [
          { $set: { refCount: { $add: ["$refCount", delta] } } },
          {
            $set: {
              deletedAt: {
                $cond: [{ $lte: ["$refCount", 0] }, "$$NOW", "$$REMOVE"],
              },
            },
          },
        ],
      },
    }));

  if (fileOperations.length > 0) {
    await UploadedFile.bulkWrite(fileOperations, { ordered: false });
  }
}

/**
 * Applies a delta to the reference count of a file object
 * @param {string} fileId MongoDB ID of file
 * @param {number} delta Amount to increment/decrement by
 * @returns {Promise<void>}
 */
export async function applyReferenceDelta(fileId, delta) {
  if (delta === 0) return;
  await UploadedFile.updateOne({ _id: fileId }, [
    { $set: { refCount: { $add: ["$refCount", delta] } } },
    {
      $set: {
        deletedAt: { $cond: [{ $lte: ["$refCount", 0] }, "$$NOW", "$$REMOVE"] },
      },
    },
  ]);
}

/**
 * Retrieves all image files for a scenario
 * @param {string} scenarioId MongoDB ID of scenario
 * @returns {Promise<Object[]>} Array of image file documents
 */
export function retrieveImageList(scenarioId) {
  return UploadedFile.find({ scenarioId, type: "image" }).lean();
}

/**
 * Retrieves a file object by ID
 * @param {string} fileId MongoDB ID of file
 * @param {string} scenarioId MongoDB ID of scenario
 * @returns {Promise<Object|null>} The file document, or null if not found
 */
export function retrieveFile(scenarioId, fileId) {
  return UploadedFile.findOne({ _id: fileId, scenarioId }).lean();
}
