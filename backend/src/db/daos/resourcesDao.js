import Resource from "../models/resource";
import Group from "../models/group";

// Create a New Resource
const createResource = async (type, content, name, requiredFlags) => {
  let dbResource = null;

  switch (type) {
    case "text":
      dbResource = new Resource({
        name,
        textContent: content,
        imageContent: "",
        requiredFlags,
      });
      await dbResource.save();
      break;
    case "image":
      dbResource = new Resource({
        name,
        textContent: "",
        imageContent: content,
        requiredFlags,
      });
      await dbResource.save();
      break;
    default:
      throw new Error(`Unsupported resource type: ${type}`);
  }

  return dbResource;
};

const getResourceById = async (resourceId) => {
  const resource = await Resource.findById(resourceId);
  return resource;
};

const deleteResourceById = async (resourceId) => {
  const resource = await Resource.findById(resourceId);
  await Resource.findByIdAndRemove(resourceId);
  return resource;
};

const getAllVisibleResources = async (groupId) => {
  const group = await Group.findById(groupId);
  const allResources = await Resource.find({});
  const flags = group.currentFlags;

  // Filter resources based on the comparison
  const visibleResources = allResources.filter((resource) =>
    resource.requiredFlags.every((flag) => flags.includes(flag))
  );

  return visibleResources;
};

const addFlag = async (groupId, flag) => {
  const group = await Group.findById(groupId);
  if (!group.currentFlags.includes(flag)) {
    group.currentFlags.push(flag);
    await group.save();
  }
  return group.currentFlags;
};

const removeFlag = async (groupId, flag) => {
  const group = await Group.findById(groupId);

  if (group.currentFlags.includes(flag)) {
    const index = group.currentFlags.indexOf(flag);
    group.currentFlags.splice(index, 1);
    await group.save();
  }

  return group.currentFlags;
};

const updateResourceById = async (
  resourceId,
  name,
  type,
  content,
  requiredFlags
) => {
  const resource = await Resource.findById(resourceId);

  resource.name = name;
  switch (type) {
    case "text":
      resource.textContent = content;
      resource.requiredFlags = requiredFlags;
      break;
    case "image":
      resource.imageContent = content;
      resource.requiredFlags = requiredFlags;
      break;
    default:
      throw new Error(`Unsupported resource type: ${type}`);
  }

  await resource.save();
  return resource;
};
export {
  createResource,
  getResourceById,
  deleteResourceById,
  addFlag,
  removeFlag,
  getAllVisibleResources,
  updateResourceById,
};
