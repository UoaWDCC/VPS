import UploadedFile from "../models/uploadedFile.js";

/**
 * Applies a batch of reference-count deltas to uploaded files.
 *
 * @param {Map<string, number>} fileRefDeltas - Map of file IDs to the amount to adjust the reference count by.
 * @returns {Promise<void>} Resolves once the bulk update completes.
 */
export async function applyReferenceDeltas(fileRefDeltas) {
  if (fileRefDeltas.size === 0) return true;

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

  if (fileOperations.length === 0) return true;

  try {
    const result = await UploadedFile.bulkWrite(fileOperations, {
      ordered: false,
    });
    const hasWriteErrors = Array.isArray(result?.writeErrors)
      ? result.writeErrors.length > 0
      : false;
    return result?.ok === 1 && !hasWriteErrors;
  } catch {
    return false;
  }
}

/**
 * Applies a single reference-count delta to a file.
 *
 * @param {string} fileId - MongoDB ID of the file.
 * @param {number} delta - Amount to increment or decrement the file reference count by.
 * @returns {Promise<void>} Resolves once the update completes.
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
 * Retrieves all files of a given type for a scenario.
 *
 * @param {string} scenarioId - MongoDB ID of the scenario.
 * @param {string} type - File type to filter by, such as "image" or "audio".
 * @returns {Promise<Array<object>>} Matching file documents.
 */
export function retrieveFiles(scenarioId, type) {
  return UploadedFile.find({ scenarioId, type }).lean();
}

/**
 * Retrieves a file object by ID within a scenario.
 *
 * @param {string} scenarioId - MongoDB ID of the scenario.
 * @param {string} fileId - MongoDB ID of the file.
 * @returns {Promise<object|null>} The matching file document, or null if not found.
 */
export function retrieveFile(scenarioId, fileId) {
  return UploadedFile.findOne({ _id: fileId, scenarioId }).lean();
}
