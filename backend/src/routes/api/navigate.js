import { Router } from "express";
import auth from "../../middleware/firebaseAuth";

import Scene from "../../db/models/scene";
import User from "../../db/models/user";
import Group from "../../db/models/group";
import Scenario from "../../db/models/scenario";

import HttpError from "../../error/HttpError";
import handle from "../../error/handle";
import STATUS from "../../error/status";

const router = Router();

router.use(auth);

const getSimpleScene = async (sceneId) => {
  const scene = await Scene.findOne(
    { _id: sceneId },
    { roles: 1, components: 1 }
  ).lean();
  if (!scene)
    throw new HttpError("No scene exists with that id", STATUS.NOT_FOUND);
  return scene;
};

const getSceneConsideringRole = async (sceneId, role) => {
  const scene = await getSimpleScene(sceneId);
  if (scene.roles.length && !scene.roles.includes(role))
    throw new HttpError("Invalid role to access this scene", STATUS.FORBIDDEN, {
      roles_with_access: scene.roles,
    });
  return scene;
};

const getGroupByScenarioAndUser = async (scenarioId, uid) => {
  const { email } = await User.findOne({ uid }, { email: 1 }).lean();
  const group = await Group.findOne(
    { scenarioId, users: { $elemMatch: { email } } },
    { "users.$": 1, scenarioId: 1, path: 1 }
  ).lean();
  if (!group)
    throw new HttpError(
      "No group exists for this user and scenario",
      STATUS.NOT_FOUND
    );
  return group;
};

const getScenarioFirstScene = async (scenarioId) => {
  const scenario = await Scenario.findById(scenarioId, {
    scenes: { $slice: 1 },
  }).lean();
  return scenario.scenes[0];
};

const getConnectedScenes = async (sceneID, role) => {
  const scene = await getSceneConsideringRole(sceneID, role);
  const connectedIds = scene.components
    .filter((c) => c.type === "BUTTON")
    .map((b) => b.nextScene);
  const connectedScenes = await Scene.find(
    { _id: { $in: connectedIds } },
    { roles: 1, components: 1 }
  ).lean();
  const filtered = connectedScenes.map((s) => {
    if (s.roles.includes(role) || !s.roles.length) return s;
    const error = new HttpError(
      "Invalid role to access this scene",
      STATUS.FORBIDDEN,
      {
        roles_with_access: s.roles,
      }
    );
    return { _id: s._id, ...error.toJSON() };
  });
  return { this: scene, connected: filtered };
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

router.post(
  "/",
  handle(async (req, res) => {
    const { uid, scenarioId, currentScene, nextScene } = req.body;

    const group = await getGroupByScenarioAndUser(scenarioId, uid);
    const { role } = group.users[0];

    // the first time any user in the group is navigating
    if (!group.path.length) {
      const firstSceneID = await getScenarioFirstScene(scenarioId);
      const [, scenes] = await Promise.all([
        addSceneToPath(group._id, null, firstSceneID),
        getConnectedScenes(firstSceneID, role),
      ]);
      return res.status(STATUS.OK).json(scenes);
    }

    // the first time the user is navigating in their session
    if (!currentScene || !nextScene) {
      const connectedScenes = await getConnectedScenes(group.path[0], role);
      return res.status(STATUS.OK).json(connectedScenes);
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
      getConnectedScenes(nextScene, role),
    ]);

    return res.status(STATUS.OK).json({ connected: scenes.connected });
  })
);

export default router;
