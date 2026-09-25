// helpers that derive "new" resources from visible tree + "seen" list

export function collectVisibleFileIds(tree) {
  const ids = [];
  for (const resource of tree) {
    if (resource.type === "collection") {
      for (const child of resource.children) ids.push(child._id);
    } else {
      ids.push(resource._id);
    }
  }
  return ids;
}

export function getUnseenIds(visibleIds, seenIds) {
  const seen = new Set(seenIds);
  return visibleIds.filter((id) => !seen.has(id));
}
