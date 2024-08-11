import Scene from "../../../db/models/scene";
import User from "../../../db/models/user";
import Group from "../../../db/models/group";
import Scenario from "../../../db/models/scenario";
import Note from "../../../db/models/note";
import HttpError from "../../../error/HttpError";
import STATUS from "../../../error/status";

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

const deleteNoteNoRoleCheck = async (noteId, groupId) => {
  const note = await Note.findById(noteId);
  const updateQuery = {
    $pull: { [`notes.${note.role}`]: noteId },
  };
  //  delete note from group
  await Group.updateOne({ _id: groupId }, updateQuery);

  if (!note) {
    throw new HttpError("Note not found", STATUS.NOT_FOUND);
  }
  await note.delete();
  return true;
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
  if (noteList && noteList.length > 0) {
    await Promise.all(
      noteList.map(({ id }) => deleteNoteNoRoleCheck(id, groupId))
    );
  }
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
    { "users.$": 1, scenarioId: 1, path: 1 }
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

export const groupNavigate = async (req) => {
  const { uid, currentScene, nextScene } = req.body;

  const group = await getGroupByIdAndUser(req.params.groupId, uid);
  const { role } = group.users[0];

  // the first time any user in the group is navigating
  if (!group.path.length) {
    const firstSceneId = await getScenarioFirstScene(group.scenarioId);
    const [, scenes] = await Promise.all([
      addSceneToPath(group._id, null, firstSceneId),
      getConnectedScenes(firstSceneId, role),
    ]);
    return { status: STATUS.OK, json: scenes };
  }

  // the first time the user is navigating in their session
  if (!currentScene || !nextScene) {
    const scenes = await getConnectedScenes(group.path[0], role);
    return { status: STATUS.OK, json: scenes };
  }

  // the user is navigating from one scene to another

  if (group.path[0] !== currentScene)
    throw new HttpError("Scene mismatch has occured", STATUS.CONFLICT);

  const scene = await getSceneConsideringRole(currentScene, role);
  const connectedIds = scene.components
    .filter((c) => c.type === "BUTTON")
    .map((b) => b.nextScene);
  if (!connectedIds.includes(nextScene))
    throw new HttpError("Invalid scene transition", STATUS.FORBIDDEN);

  const [, scenes] = await Promise.all([
    addSceneToPath(group._id, currentScene, nextScene),
    getConnectedScenes(nextScene, role, false),
  ]);

  return { status: STATUS.OK, json: scenes };
};

export const groupReset = async (req) => {
  const { uid, currentScene } = req.body;
  const group = await getGroupByIdAndUser(req.params.groupId, uid);
  const { role } = group.users[0];

  if (!(await deleteAllNotes(group))) {
    throw new HttpError("Failed to delete notes", STATUS.INTERNAL_SERVER_ERROR);
  }

  if (group.path[0] !== currentScene)
    throw new HttpError("Scene mismatch has occured", STATUS.CONFLICT);

  const scene = await getSceneConsideringRole(currentScene, role);
  const hasReset = scene.components.some((c) => c.type === "RESET_BUTTON");
  if (!hasReset) throw new HttpError("Invalid reset", STATUS.FORBIDDEN);

  await Group.findOneAndUpdate({ _id: group._id }, { $set: { path: [] } });

  return { status: STATUS.OK };
};
