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
}

const getResourceById = async (resourceId) => {
    const resource = await Resource.findById(resourceId);
    return resource;
}

const deleteResourceById = async (resourceId) => {
    const resource = await Resource.findByIdAndRemove(resourceId);
    return resource;
}

// const getAllVisibleResources = async (groupId) => {
//     const resource = await Group.findById(groupId);

//     // return the groups resources?

// }



export { getGroup, createResource, getResourceById, deleteResourceById };
