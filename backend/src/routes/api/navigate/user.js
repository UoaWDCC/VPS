import { getStateVariables } from "../../../db/daos/scenarioDao.js";
import { getComponent } from "../../../db/daos/sceneDao.js";
import { setUserStateVariables } from "../../../db/daos/userDao.js";
import Scene from "../../../db/models/scene.js";
import User from "../../../db/models/user.js";

import { HttpError } from "../../../util/error.js";
import { applyStateOperations } from "../../../util/statevariables/stateOperations.js";
import STATUS from "../../../util/status.js";

import { getScenarioFirstScene, getSimpleScene } from "./group.js";

const getConnectedScenes = async (sceneID, active = true) => {
  const scene = await getSimpleScene(sceneID);
  const connectedIds = scene.components
    .filter((c) => c.clickable)
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

// Initiates state variables for a user
const initiateStateVariables = async (userId, scenarioId) => {
  const stateVariables = await getStateVariables(scenarioId);
  return await setUserStateVariables(userId, scenarioId, stateVariables);
};

// Update state variables for a user
const updateStateVariables = async (user, scenarioId, component) => {
  // If no update necessary, just return existing data

  if (!component.stateOperations) {
    return [user.stateVariables[scenarioId], user.stateVersions[scenarioId]];
  }
  const stateVariables = applyStateOperations(
    user.stateVariables[scenarioId],
    component.stateOperations
  );
  return await setUserStateVariables(user._id, scenarioId, stateVariables);
};

export const userNavigate = async (req) => {
  const { uid, currentScene, componentId } = req.body;
  const { scenarioId } = req.params;

  const user = await User.findOne(
    { uid },
    { paths: 1, _id: 1, stateVariables: 1, stateVersions: 1 }
  ).lean();
  const path = user.paths[scenarioId];

  // the first time the user  is navigating
  if (!path) {
    const firstSceneId = await getScenarioFirstScene(scenarioId);
    const [, scenes, [stateVariables, stateVersion]] = await Promise.all([
      addSceneToPath(user._id, scenarioId, null, firstSceneId),
      getConnectedScenes(firstSceneId),
      initiateStateVariables(user._id, scenarioId),
    ]);
    return {
      status: STATUS.OK,
      json: { ...scenes, stateVariables, stateVersion },
    };
  }

  // the first time the user is navigating in their session
  if (!currentScene) {
    const scenes = await getConnectedScenes(path[0]);
    const stateVariables = user.stateVariables[scenarioId];
    const stateVersion = user.stateVersions[scenarioId];
    return {
      status: STATUS.OK,
      json: { ...scenes, stateVariables, stateVersion },
    };
  }

  // the user is navigating from one scene to another

  if (path[0] !== currentScene)
    throw new HttpError("Scene mismatch has occured", STATUS.CONFLICT);

  const component = await getComponent(currentScene, componentId);

  // if the button does not lead to another scene or component does not exist, stay in the current scene
  let scenes = null;
  if (component?.nextScene !== currentScene) {
    const nextScene = component.nextScene;
    [, scenes] = await Promise.all([
      addSceneToPath(user._id, scenarioId, currentScene, nextScene),
      getConnectedScenes(nextScene, false),
    ]);
  }

  const [stateVariables, stateVersion] = await updateStateVariables(
    user,
    scenarioId,
    component
  );

  return {
    status: STATUS.OK,
    json: { ...scenes, stateVariables, stateVersion },
  };
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
    { $unset: { [`paths.${scenarioId}`]: "" } }
  );

  return { status: STATUS.OK };
};
