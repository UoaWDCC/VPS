import { getStateVariables } from "../../../db/daos/scenarioDao.js";
import { getComponent } from "../../../db/daos/sceneDao.js";
import { setUserStateVariables } from "../../../db/daos/userDao.js";
import { isAuthor } from "../../../middleware/scenarioAuth.js";
import Scene from "../../../db/models/scene.js";
import User from "../../../db/models/user.js";

import { HttpError } from "../../../util/error.js";
import { applyStateOperations } from "../../../util/statevariables/stateOperations.js";
import STATUS from "../../../util/status.js";

import { getScenarioFirstScene, getSimpleScene } from "./group.js";
import {
  freshRemainingTime,
  resumedRemainingTime,
  movedRemainingTimeField,
} from "./timer.js";

const getConnectedScenes = async (sceneID, active = true) => {
  const scene = await getSimpleScene(sceneID);
  const connectedIds = scene.components
    .filter((c) => c.clickable)
    .map((b) => b.nextScene)
    .filter(Boolean);
  const connected = await Scene.find(
    { _id: { $in: connectedIds } },
    {
      components: 1,
      directLink: 1,
      directLinkKey: 1,
      roles: 1,
      time: 1,
      timerStateOperations: 1,
    }
  ).lean();
  return {
    active: scene._id,
    scenes: active ? [...connected, scene] : connected,
  };
};

// Atomic so concurrent requests are handled safely. `replace: true` discards
// any existing path (used for an author jump to an arbitrary scene, where the
// prior history is no longer valid) instead of requiring it to continue from
// `currentSceneId`.
const addSceneToPath = async (
  userId,
  scenarioId,
  currentSceneId,
  sceneId,
  { replace = false } = {}
) => {
  const pathField = `paths.${scenarioId}`;
  const enteredField = `sceneEnteredAt.${scenarioId}`;

  const filter = replace
    ? { _id: userId }
    : {
        _id: userId,
        $or: [
          { [`${pathField}.0`]: currentSceneId },
          { [pathField]: { $exists: false } },
        ],
      };

  const update = replace
    ? { $set: { [pathField]: [sceneId], [enteredField]: new Date() } }
    : {
        $push: { [pathField]: { $each: [sceneId], $position: 0 } },
        $set: { [enteredField]: new Date() },
      };

  const res = await User.findOneAndUpdate(filter, update);
  if (!res) throw new HttpError("Scene mismatch has occured", STATUS.CONFLICT);
  return STATUS.OK;
};

// Initiates state variables for a user
const initiateStateVariables = async (userId, scenarioId) => {
  const stateVariables = await getStateVariables(scenarioId);
  return await setUserStateVariables(userId, scenarioId, stateVariables);
};

// Sync state variables for a user (author may have changed state in-between playthroughs)
const syncStateVariables = async (user, scenarioId) => {
  const stateVariables = user.stateVariables[scenarioId];
  const scenarioStateVariables = await getStateVariables(scenarioId);

  const newStateVariables = scenarioStateVariables.map((scenarioVar) => {
    const existingVar = stateVariables.find((v) => v.id === scenarioVar.id);

    if (existingVar && existingVar.type === scenarioVar.type) {
      return existingVar;
    } else {
      return scenarioVar;
    }
  });

  if (JSON.stringify(newStateVariables) !== JSON.stringify(stateVariables)) {
    return await setUserStateVariables(user._id, scenarioId, newStateVariables);
  }
  return [stateVariables, user.stateVersions[scenarioId]];
};

// Update state variables for a user
const updateStateVariables = async (user, scenarioId, component) => {
  if (!component || !component.stateOperations) {
    return [user.stateVariables[scenarioId], user.stateVersions[scenarioId]];
  }

  const stateVariables = applyStateOperations(
    user.stateVariables[scenarioId],
    component.stateOperations
  );

  return await setUserStateVariables(user._id, scenarioId, stateVariables);
};

export const userNavigate = async (req) => {
  const {
    uid,
    currentScene,
    componentId,
    nextScene: bodyNextScene,
    startScene: startSceneParam,
  } = req.body;
  const { scenarioId } = req.params;

  const [user, authorised] = await Promise.all([
    User.findOne(
      { uid },
      {
        paths: 1,
        _id: 1,
        stateVariables: 1,
        stateVersions: 1,
        sceneEnteredAt: 1,
      }
    ).lean(),
    // Only hit the access list when startScene is present — avoids an extra DB query on every normal player request.
    startSceneParam ? await isAuthor(scenarioId, uid) : false,
  ]);

  // Non-authors cannot jump to an arbitrary scene even if they manually craft a URL with startScene.
  const startScene = authorised ? startSceneParam : null;
  const path = user.paths[scenarioId];

  // the first time the user is navigating
  if (!path) {
    const firstSceneId =
      startScene || (await getScenarioFirstScene(scenarioId));
    const [, scenes, [stateVariables, stateVersion]] = await Promise.all([
      addSceneToPath(user._id, scenarioId, null, firstSceneId),
      getConnectedScenes(firstSceneId),
      initiateStateVariables(user._id, scenarioId),
    ]);
    return {
      status: STATUS.OK,
      json: {
        ...scenes,
        stateVariables,
        stateVersion,
        remainingTime: freshRemainingTime(scenes),
      },
    };
  }

  // the first time the user is navigating in their session
  if (!currentScene) {
    const activeSceneId = startScene || path[0];
    const isJump = startScene && startScene !== path[0];

    // A jump replaces the entire path (the prior history is invalid after
    // jumping to an arbitrary scene) and restamps the timer, since it's a
    // fresh entry; a plain re-fetch/refresh does neither.
    const updatePromise = isJump
      ? addSceneToPath(user._id, scenarioId, null, startScene, {
          replace: true,
        })
      : Promise.resolve();

    const [, scenes] = await Promise.all([
      updatePromise,
      getConnectedScenes(activeSceneId),
    ]);

    const [stateVariables, stateVersion] = await syncStateVariables(
      user,
      scenarioId
    );

    // A jump enters a fresh scene (full time); a plain re-fetch/refresh must
    // resume from the untouched entry stamp so refreshing can't reset the timer.
    const remainingTime = isJump
      ? freshRemainingTime(scenes)
      : resumedRemainingTime(scenes, user.sceneEnteredAt?.[scenarioId]);

    return {
      status: STATUS.OK,
      json: { ...scenes, stateVariables, stateVersion, remainingTime },
    };
  }

  // the user is navigating from one scene to another

  if (path[0] !== currentScene)
    throw new HttpError("Scene mismatch has occured", STATUS.CONFLICT);

  if (bodyNextScene) {
    const scene = await Scene.findById(currentScene, { directLink: 1 }).lean();
    if (!scene?.directLink?.equals(bodyNextScene))
      throw new HttpError("Invalid direct link target", STATUS.FORBIDDEN);
  }

  const component = componentId
    ? await getComponent(currentScene, componentId)
    : null;

  let scenes = null;

  const nextScene = component?.nextScene ?? bodyNextScene;

  if (nextScene && nextScene !== currentScene) {
    [, scenes] = await Promise.all([
      addSceneToPath(user._id, scenarioId, currentScene, nextScene),
      getConnectedScenes(nextScene, true),
    ]);
  }

  const [stateVariables, stateVersion] = await updateStateVariables(
    user,
    scenarioId,
    component
  );

  return {
    status: STATUS.OK,
    json: {
      ...scenes,
      stateVariables,
      stateVersion,
      ...movedRemainingTimeField(scenes),
    },
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
    {
      $unset: {
        [`paths.${scenarioId}`]: "",
        [`sceneEnteredAt.${scenarioId}`]: "",
      },
    }
  );

  return { status: STATUS.OK };
};
