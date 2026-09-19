//helpers that derive "new" resources from visible tree + "seen" list
//collection is new if any of its children are new

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

//prune "seen" for no-longer viewable resources
//so that users are notified if they become available again
export function getStaleSeenIds(visibleIds, seenIds) {
  const visible = new Set(visibleIds);
  return seenIds.filter((id) => !visible.has(id));
}
