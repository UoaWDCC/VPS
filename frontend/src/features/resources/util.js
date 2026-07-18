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
