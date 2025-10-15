import Scene from "../../../db/models/scene.js";
import User from "../../../db/models/user.js";
import Group from "../../../db/models/group.js";
import Scenario from "../../../db/models/scenario.js";
import Note from "../../../db/models/note.js";
import Resource from "../../../db/models/resource.js";
import { HttpError } from "../../../util/error.js";
import STATUS from "../../../util/status.js";
import { getStateVariables } from "../../../db/daos/scenarioDao.js";
import { setGroupStateVariables } from "../../../db/daos/groupDao.js";
import { applyStateOperations } from "../../../util/statevariables/stateOperations.js";
import { getComponent } from "../../../db/daos/sceneDao.js";

const createInvalidError = (roles) =>
  new HttpError("Invalid role to access this scene", STATUS.FORBIDDEN, {
    roles_with_access: roles,
  });

export const getSimpleScene = async (sceneId) => {
  const scene = await Scene.findOne(
    { _id: sceneId },
    { roles: 1, components: 1 }
  ).lean();
  if (!scene)
    throw new HttpError("No scene exists with that id", STATUS.NOT_FOUND);
  return scene;
};

const deleteAllNotes = async (groupData) => {
  const groupId = groupData._id;
  const group = await Group.findById(groupId, { notes: 1 }).lean();
  if (!group) {
    throw new HttpError("Group not found", STATUS.NOT_FOUND);
  }
  const noteList = Object.entries(group.notes).flatMap(([role, ids]) =>
    ids.map((id) => ({ role, id }))
  );
  const noteId = noteList.map(({ id }) => id);
  await Note.deleteMany({ _id: { $in: noteId } });
  await Group.updateOne({ _id: groupId }, { $set: { notes: {} } }).exec();
  // if (res.nModified !== 1) {
  //   throw new HttpError("Failed to delete notes", STATUS.INTERNAL_SERVER_ERROR);
  // }
  return true;
};

export const getScenarioFirstScene = async (scenarioId) => {
  const scenario = await Scenario.findById(scenarioId, {
    scenes: { $slice: 1 },
  }).lean();
  return scenario.scenes[0];
};

const getSceneConsideringRole = async (sceneId, role) => {
  const scene = await getSimpleScene(sceneId);
  if (scene.roles.length && !scene.roles.includes(role))
    throw createInvalidError(scene.roles);
  return scene;
};

const getGroupByIdAndUser = async (groupId, uid) => {
  const { email } = await User.findOne({ uid }, { email: 1 }).lean();
  const group = await Group.findOne(
    { _id: groupId, users: { $elemMatch: { email } } },
    { "users.$": 1, scenarioId: 1, path: 1, stateVariables: 1, stateVersion: 1 }
  ).lean();
  if (!group)
    throw new HttpError(
      "No group exists for this id and user",
      STATUS.NOT_FOUND
    );
  return group;
};

const getConnectedScenes = async (sceneID, role, active = true) => {
  const scene = await getSceneConsideringRole(sceneID, role);
  const connectedIds = scene.components
    .filter((c) => c.type === "BUTTON")
    .map((b) => b.nextScene)
    .filter(Boolean);
  const connectedScenes = await Scene.find(
    { _id: { $in: connectedIds } },
    { roles: 1, components: 1 }
  ).lean();
  const filtered = connectedScenes.map((s) => {
    if (s.roles.includes(role) || !s.roles.length) return s;
    const error = createInvalidError(s.roles);
    return { _id: s._id, ...error.toJSON() };
  });
  return {
    active: scene._id,
    scenes: active ? [...filtered, scene] : filtered,
  };
};

// this is atomic so will properly handle concurrent requests
const addSceneToPath = async (groupId, currentSceneId, sceneId) => {
  const res = await Group.findOneAndUpdate(
    {
      _id: groupId,
      $or: [{ "path.0": currentSceneId }, { path: { $size: 0 } }],
    },
    { $push: { path: { $each: [sceneId], $position: 0 } } }
  );
  if (!res) throw new HttpError("Scene mismatch has occured", STATUS.CONFLICT);
  return STATUS.OK;
};

// Adds flags to group on scene change
const addFlagsToGroup = async (groupId, newFlags) => {
  try {
    const group = await Group.findOneAndUpdate(
      { _id: groupId },
      { $addToSet: { currentFlags: { $each: newFlags } } },
      { new: true }
    );

    if (!group) {
      throw new Error("Group not found");
    }

    return STATUS.OK;
  } catch (error) {
    throw new Error("Error updating group flags:", error);
  }
};

// Remove flags to group on scene change
const removeFlagsFromGroup = async (groupId, flags) => {
  try {
    const group = await Group.findOneAndUpdate(
      { _id: groupId },
      { $pull: { currentFlags: { $in: flags } } },
      { new: true }
    );

    if (!group) {
      throw new Error("Group not found");
    }

    return STATUS.OK;
  } catch (error) {
    throw new Error("Error updating group flags:", error);
  }
};

// Initiates state variables for a group
const initiateStateVariables = async (groupId, scenarioId) => {
  const stateVariables = await getStateVariables(scenarioId);
  return await setGroupStateVariables(groupId, stateVariables);
};

// Updates state variables for a group
const updateStateVariables = async (group, component) => {
  // If no update necessary, just return existing data
  if (!component.stateOperations) {
    return [group.stateVariables, group.stateVersion];
  }
  const stateVariables = applyStateOperations(
    group.stateVariables,
    component.stateOperations
  );

  return await setGroupStateVariables(group._id, stateVariables);
};

export const groupNavigate = async (req) => {
  const { uid, currentScene, addFlags, removeFlags, componentId } = req.body;

  const group = await getGroupByIdAndUser(req.params.groupId, uid);
  const { role } = group.users[0];

  // the first time any user in the group is navigating
  if (!group.path.length) {
    const firstSceneId = await getScenarioFirstScene(group.scenarioId);
    const [, , , scenes, [stateVariables, stateVersion]] = await Promise.all([
      addSceneToPath(group._id, null, firstSceneId),
      addFlagsToGroup(group._id, addFlags),
      removeFlagsFromGroup(group._id, removeFlags),
      getConnectedScenes(firstSceneId, role),
      initiateStateVariables(group._id, group.scenarioId),
    ]);
    return {
      status: STATUS.OK,
      json: { ...scenes, stateVariables, stateVersion },
    };
  }

  // the first time the user is navigating in their session
  if (!currentScene) {
    const scenes = await getConnectedScenes(group.path[0], role);
    const stateVariables = group.stateVariables;
    const stateVersion = group.stateVersion;
    return {
      status: STATUS.OK,
      json: { ...scenes, stateVariables, stateVersion },
    };
  }
  // the user is navigating from one scene to another
  if (group.path[0] !== currentScene)
    throw new HttpError("Scene mismatch has occured", STATUS.CONFLICT);

  // Validate that the user is allowed to move to this scene
  await getSceneConsideringRole(currentScene, role);

  const component = await getComponent(currentScene, componentId);

  // if the button does not lead to another scene or component does not exist, stay in the current scene
  let scenes = null;
  if (component?.nextScene !== currentScene) {
    const nextScene = component.nextScene;
    [, , , scenes] = await Promise.all([
      addSceneToPath(group._id, currentScene, nextScene),
      addFlagsToGroup(group._id, addFlags),
      removeFlagsFromGroup(group._id, removeFlags),
      getConnectedScenes(nextScene, role, false),
    ]);
  }

  const [stateVariables, stateVersion] = await updateStateVariables(
    group,
    component
  );

  return {
    status: STATUS.OK,
    json: { ...scenes, stateVariables, stateVersion },
  };
};

export const groupReset = async (req) => {
  const { uid, currentScene } = req.body;

  const group = await getGroupByIdAndUser(req.params.groupId, uid);
  if (!group) {
    throw new HttpError("Group not found", STATUS.NOT_FOUND);
  }
  const { role } = group.users[0];

  if (!(await deleteAllNotes(group)))
    throw new HttpError("Failed to delete notes", STATUS.INTERNAL_SERVER_ERROR);

  if (group.path[0] !== currentScene)
    throw new HttpError("Scene mismatch has occured", STATUS.CONFLICT);

  const scene = await getSceneConsideringRole(currentScene, role);
  if (!scene || !scene.components) {
    throw new HttpError("Scene not found or invalid", STATUS.NOT_FOUND);
  }

  const hasReset = scene.components.some((c) => c.type === "RESET_BUTTON");
  if (!hasReset) throw new HttpError("Invalid reset", STATUS.FORBIDDEN);

  await Group.updateOne(
    { _id: req.params.groupId },
    { $set: { path: [], currentFlags: [] } }
  ).exec();

  return { status: STATUS.OK };
};

// Fetches groups flags and returns resources
export const groupGetResources = async (req) => {
  const group = await Group.findById(req.params.groupId);

  if (!group) {
    throw new HttpError("Group not found", STATUS.NOT_FOUND);
  }

  const flags = group.currentFlags || [];
  const resources = [];

  // Fetch all resources from the database
  const allResources = await Resource.find({});

  // Filter resources where all requiredFlags are present in the group's current flags
  const matchingResources = allResources.filter((resource) =>
    resource.requiredFlags.every((flag) => flags.includes(flag))
  );

  // Push the filtered resources to the resources array
  resources.push(...matchingResources);

  return { status: STATUS.OK, json: resources };
};
