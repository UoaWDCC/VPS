export function normaliseFile(resource) {
  return {
    _id: resource._id,
    parentId: resource.parentId,
    name: resource.name,
    stateConditionals: resource.stateConditionals,
    fileId: resource.fileId?._id,
    url: resource.fileId?.url,
    type: resource.type,
    fileType: resource.fileId?.type,
    contentType: resource.fileId?.contentType,
    size: resource.fileId?.size,
  };
}

export function filterTreeBySearch(tree, string) {
  const q = string.trim()?.toLowerCase();
  if (!q) return tree;

  return tree
    .map((r) => {
      const isMatch = r.name.toLowerCase().includes(q);
      if (r.type !== "collection") return isMatch;
      const matchingChildren = (r.children || []).filter((c) => {
        return isMatch || c.name.toLowerCase().includes(q);
      });
      if (matchingChildren.length === 0) return null;
      return { ...r, children: matchingChildren };
    })
    .filter(Boolean);
}
