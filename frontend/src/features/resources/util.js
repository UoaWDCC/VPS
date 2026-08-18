export function isTemp(resource) {
  return resource._id.startsWith("temp.");
}

export function getExtension(name) {
  if (!name) return "";
  const dotIndex = name.lastIndexOf(".");
  return dotIndex <= 0 ? "" : name.slice(dotIndex).toLowerCase();
}

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
    extension: getExtension(resource.fileId?.name),
  };
}

export function filterTreeBySearch(tree, string) {
  const q = string.trim()?.toLowerCase();
  if (!q) return tree;

  return tree
    .map((r) => {
      const isMatch = r.name.toLowerCase().includes(q);
      if (r.type !== "collection") return isMatch ? r : null;
      const matchingChildren = (r.children || []).filter((c) => {
        return isMatch || c.name.toLowerCase().includes(q);
      });
      if (matchingChildren.length === 0) return null;
      return { ...r, children: matchingChildren };
    })
    .filter(Boolean);
}
