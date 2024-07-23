import Scene from "../../../db/models/scene";
import User from "../../../db/models/user";

import HttpError from "../../../error/HttpError";
import STATUS from "../../../error/status";

import { getScenarioFirstScene, getSimpleScene } from "./group";

const getConnectedScenes = async (sceneID, active = true) => {
  const scene = await getSimpleScene(sceneID);
  const connectedIds = scene.components
    .filter((c) => c.type === "BUTTON")
    .map((b) => b.nextScene)
    .filter(Boolean);
  const connected = await Scene.find(
    { _id: { $in: connectedIds } },
    { components: 1 }
  ).lean();
  return {
    active: scene._id,
    scenes: active ? [...connected, scene] : connected,
  };
};

const addSceneToPath = async (userId, scenarioId, currentSceneId, sceneId) => {
  const user = await User.findById(userId);
  if (!user.paths.get(scenarioId)) {
    user.paths.set(scenarioId, [sceneId]);
  } else {
    if (user.paths.get(scenarioId)[0] !== currentSceneId)
      throw new HttpError("Scene mismatch has occured", STATUS.CONFLICT);
    user.paths.get(scenarioId).unshift(sceneId);
  }
  user.markModified("paths");
  await user.save();
  return STATUS.OK;
};

export const userNavigate = async (req) => {
  const { uid, currentScene, nextScene } = req.body;
  const { scenarioId } = req.params;

  const user = await User.findOne({ uid }, { paths: 1, _id: 1 }).lean();
  const path = user.paths[scenarioId];

  // the first time the user  is navigating
  if (!path) {
    const firstSceneId = await getScenarioFirstScene(scenarioId);
    const [, scenes] = await Promise.all([
      addSceneToPath(user._id, scenarioId, null, firstSceneId),
      getConnectedScenes(firstSceneId),
    ]);
    return { status: STATUS.OK, json: scenes };
  }

  // the first time the user is navigating in their session
  if (!currentScene || !nextScene) {
    const scenes = await getConnectedScenes(path[0]);
    return { status: STATUS.OK, json: scenes };
  }

  // the user is navigating from one scene to another

  if (path[0] !== currentScene)
    throw new HttpError("Scene mismatch has occured", STATUS.CONFLICT);

  const scene = await getSimpleScene(currentScene);
  const connectedIds = scene.components
    .filter((c) => c.type === "BUTTON")
    .map((b) => b.nextScene);
  if (!connectedIds.includes(nextScene))
    throw new HttpError("Invalid scene transition", STATUS.FORBIDDEN);

  const [, scenes] = await Promise.all([
    addSceneToPath(user._id, scenarioId, currentScene, nextScene),
    getConnectedScenes(nextScene, false),
  ]);

  return { status: STATUS.OK, json: scenes };
};

export const userReset = async (req) => {
  const { uid, currentScene } = req.body;
  const { scenarioId } = req.params;

  const user = await User.findOne({ uid }, { paths: 1, _id: 1 }).lean();
  const path = user.paths[scenarioId];

  if (path[0] !== currentScene)
    throw new HttpError("Scene mismatch has occured", STATUS.CONFLICT);

  const scene = await getSimpleScene(currentScene);
  const hasReset = scene.components.some((c) => c.type === "RESET_BUTTON");
  if (!hasReset) throw new HttpError("Invalid reset", STATUS.FORBIDDEN);

  await User.findOneAndUpdate(
    { _id: user._id },
    { $set: { [`paths.${scenarioId}`]: [] } }
  );

  return { status: STATUS.OK };
};
