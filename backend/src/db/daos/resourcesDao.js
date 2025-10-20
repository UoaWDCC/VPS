import Resource from "../models/resource.js";
import Group from "../models/group.js";

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

const bulkCreateResources = async (scenarioId, resources) => {
  if (!Array.isArray(resources)) {
    throw new Error("Resource list must be an array");
  }

  // Optional: delete previous resources for the scenario
  await Resource.deleteMany({ scenarioId });

  const enrichedResources = resources.map((r) => {
    const base = {
      name: r.name || "",
      requiredFlags: r.requiredFlags || [],
      scenarioId,
    };

    // Determine type and content
    if (r.type === "text") {
      return {
        ...base,
        type: "text",
        textContent: r.content || "",
        imageContent: "",
      };
    } else if (r.type === "image") {
      return {
        ...base,
        type: "image",
        textContent: "",
        imageContent: r.content || "",
      };
    } else {
      throw new Error(`Unsupported resource type: ${r.type}`);
    }
  });

  // Insert all resources at once
  return await Resource.insertMany(enrichedResources);
};

const updateResourceById = async (
  resourceId,
  name,
  type,
  content,
  requiredFlags,
  stateConditionals
) => {
  const resource = await Resource.findById(resourceId);

  resource.name = name;
  resource.requiredFlags = requiredFlags;
  resource.stateConditionals = stateConditionals;

  switch (type) {
    case "text":
      resource.textContent = content;
      break;
    case "image":
      resource.imageContent = content;
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
  bulkCreateResources,
};
