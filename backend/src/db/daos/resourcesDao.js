import Resource from "../models/resource";
import Group from "../models/group";

const getGroup = async (groupId) => {
  const group = await Group.findById(groupId);
  return group;
};

// Create a New Resource
const createResource = async (type, resource) => {
  const dbResource = new Resource({ type, resource });
  await dbResource.save();
  return dbResource;
};

const getResourceById = async (resourceId) => {
  const resource = await Resource.findById(resourceId);
  return resource;
};

const deleteResourceById = async (resourceId) => {
  const resource = await Resource.findByIdAndRemove(resourceId);
  return resource;
};

// const getAllVisibleResources = async (groupId) => {
//     const resource = await Group.findById(groupId);

//     // return the groups resources?

// }

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

export {
  getGroup,
  createResource,
  getResourceById,
  deleteResourceById,
  addFlag,
  removeFlag,
};
