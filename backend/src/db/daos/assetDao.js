import Asset from "../models/asset.js";
import UploadedFile from "../models/uploadedFile.js";

const DEFAULT_LIMIT = 200;
const MAX_LIMIT = 500;

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Lists a user's assets, newest first.
 *
 * @param {string} ownerUid
 * @param {object} [filters]
 * @param {"image" | "audio" | "document"} [filters.type]
 * @param {string} [filters.tag] - an exact (normalised) tag
 * @param {string} [filters.q] - search words; each must match the name or a tag
 * @param {number} [filters.limit]
 */
export function listAssets(ownerUid, { type, tag, q, limit } = {}) {
  const filter = { ownerUid };
  if (type) filter.type = type;
  if (tag) filter.tags = tag;

  const words = (q ?? "").trim().split(/\s+/).filter(Boolean);
  if (words.length) {
    filter.$and = words.map((word) => {
      const pattern = new RegExp(escapeRegex(word), "i");
      return { $or: [{ name: pattern }, { tags: pattern }] };
    });
  }

  const take = Math.min(
    Math.max(parseInt(limit, 10) || DEFAULT_LIMIT, 1),
    MAX_LIMIT
  );
  return Asset.find(filter).sort({ createdAt: -1, _id: -1 }).limit(take).lean();
}

/** An asset, but only if it belongs to this user. */
export function retrieveOwnedAsset(assetId, ownerUid) {
  return Asset.findOne({ _id: assetId, ownerUid });
}

/**
 * The scenario's copy of an asset, made the first time it's used there and
 * reused after that. It points at the asset's stored object, and starts out
 * orphaned until a scene references it, like any freshly uploaded file.
 *
 * @returns {Promise<{ file: object, created: boolean }>}
 */
export async function useAssetInScenario(asset, scenarioId) {
  const existing = await UploadedFile.findOne({
    scenarioId,
    assetId: asset._id,
  });
  if (existing) return { file: existing, created: false };

  const file = await UploadedFile.create({
    name: asset.name,
    type: asset.type,
    path: asset.path,
    url: asset.url,
    contentType: asset.contentType,
    size: asset.size,
    uploaderUid: asset.ownerUid,
    scenarioId,
    assetId: asset._id,
    orphanedAt: Date.now(),
  });
  return { file, created: true };
}

/**
 * Removes an asset from its owner's library. Scenarios that already use it keep
 * working: their files stay, just no longer tied to a library entry.
 *
 * @returns {Promise<{ removed: object | null, storageStillUsed: boolean }>}
 *   `storageStillUsed` is whether any scenario file still points at the stored
 *   object, in which case the caller must not delete it.
 */
export async function removeAsset(assetId, ownerUid) {
  const removed = await Asset.findOneAndDelete({ _id: assetId, ownerUid });
  if (!removed) return { removed: null, storageStillUsed: false };

  await UploadedFile.updateMany(
    { assetId: removed._id },
    { $set: { assetId: null } }
  );
  const storageStillUsed = Boolean(
    await UploadedFile.exists({ path: removed.path })
  );
  return { removed, storageStillUsed };
}
