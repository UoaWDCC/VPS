export function normaliseFile(resource) {
  return {
    id: resource._id,
    groupId: resource.groupId,
    name: resource.name,
    stateConditionals: resource.stateConditionals,
    fileId: resource.fileId._id,
    url: resource.fileId.url,
    type: resource.fileId.type,
    contentType: resource.fileId.contentType,
    size: resource.fileId.size,
  };
}
