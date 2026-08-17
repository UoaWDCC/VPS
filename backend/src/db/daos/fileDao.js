import UploadedFile from "../models/uploadedFile.js";

/**
 * Applies reference count deltas to multiple file objects in bulk
 * @param {Map<string, number>} fileRefDeltas Map of file ID to delta to increment by
 * @returns {Promise<void>}
 */
export async function applyReferenceDeltas(fileRefDeltas, { session } = {}) {
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
              orphanedAt: {
                $cond: [{ $lte: ["$refCount", 0] }, "$$NOW", "$$REMOVE"],
              },
            },
          },
        ],
      },
    }));

  if (fileOperations.length > 0) {
    await UploadedFile.bulkWrite(fileOperations, { ordered: false, session });
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
        orphanedAt: {
          $cond: [{ $lte: ["$refCount", 0] }, "$$NOW", "$$REMOVE"],
        },
      },
    },
  ]);
}

/**
 * Retrieves all files of a given type for a scenario
 * @param {string} scenarioId MongoDB ID of scenario
 * @param {string} type File type to filter by (e.g. "image", "audio", "document")
 * @returns {Promise<Object[]>} Array of matching file documents
 */
export function retrieveFiles(scenarioId, type) {
  return UploadedFile.find({ scenarioId, type }).lean();
}

/**
 * Retrieves a file object by ID
 * @param {string} scenarioId MongoDB ID of scenario
 * @param {string} fileId MongoDB ID of file
 * @returns {Promise<Object|null>} The file document, or null if not found
 */
export function retrieveFile(scenarioId, fileId) {
  return UploadedFile.findOne({ _id: fileId, scenarioId }).lean();
}
