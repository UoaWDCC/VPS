import UploadedFile from "../models/uploadedFile.js";

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

export async function applyReferenceDelta(id, delta) {
  if (delta === 0) return;
  await UploadedFile.updateOne({ _id: id }, [
    { $set: { refCount: { $add: ["$refCount", delta] } } },
    {
      $set: {
        deletedAt: { $cond: [{ $lte: ["$refCount", 0] }, "$$NOW", "$$REMOVE"] },
      },
    },
  ]);
}
