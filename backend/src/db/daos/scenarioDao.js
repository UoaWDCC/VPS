import Access from "../models/access.js";
import Scenario from "../models/scenario.js";
import Scene from "../models/scene.js";
import { v4 as uuidv4 } from "uuid";
import User from "../models/user.js";
import { HttpError } from "../../util/error.js";
import { addDelta, hasFileRef } from "./sceneDao.js";
import { applyReferenceDeltas } from "./fileDao.js";

/**
 * Augments scenario results with thumbnail and author metadata.
 *
 * @param {Array<object>} scenarios - Scenario records to enrich.
 * @returns {Promise<Array<object>>} The enriched scenario objects.
 */
const addThumbs = async (scenarios) => {
  const scenarioData = await Promise.all(
    scenarios.map(async (scenario) => {
      if (!scenario.scenes || !scenario.scenes[0])
        return {
          _id: scenario._id,
          name: scenario.name,
          description: scenario.description,
          estimatedTime: scenario.estimatedTime,
          user: scenario.user ?? { uid: scenario.uid },
        };
      const thumbnail = await Scene.findById(scenario.scenes[0], {
        components: 1,
        _id: 0,
      }).lean();
      return {
        _id: scenario._id,
        name: scenario.name,
        thumbnail,
        description: scenario.description,
        estimatedTime: scenario.estimatedTime,
        user: scenario.user ?? { uid: scenario.uid },
      };
    })
  );
  return scenarioData;
};

/**
 * Creates a scenario in the database with an initial scene.
 *
 * @param {string} name - Name of the scenario.
 * @param {string} uid - ID of the authoring user.
 * @param {{description?: string, estimatedTime?: string}} [details={}] - Optional scenario metadata.
 * @returns {Promise<object>} The created scenario document.
 */
export const createScenario = async (name, uid, details = {}) => {
  const firstScene = new Scene({
    name: "Scene 1",
  });
  await firstScene.save();

  let dbScenario;

  try {
    dbScenario = new Scenario({
      name,
      uid,
      scenes: [firstScene._id],
      description: details.description,
      estimatedTime: details.estimatedTime,
    });
    await dbScenario.save();
  } catch (err) {
    await Scene.deleteOne({ _id: firstScene._id });
    throw err;
  }

  return dbScenario;
};

/**
 * Retrieves all scenarios a user can access through share permissions.
 *
 * @param {string|null} uid - The user ID to resolve access for.
 * @returns {Promise<Array<object>>} The accessible scenario records.
 */
export const retrieveAccessibleScenarios = async (uid) => {
  if (!uid) return [];

  const user = await User.findOne({ uid }, { email: 1 }).lean();
  if (!user?.email) return [];

  const access = await Access.find({ accessList: user.email })
    .sort({ _id: 1 })
    .select("scenarioId -_id")
    .lean();

  const scenarioIds = access.map((a) => a.scenarioId);
  if (scenarioIds.length === 0) return [];

  return retrieveScenarios(scenarioIds);
};

/**
 * Retrieves all scenarios authored by particular user
 * @param {String} uid ID of user
 * @returns list of database scenario objects
 */
export const retrieveScenarioList = async (uid) => {
  const scenarios = await Scenario.find(
    { uid },
    { name: 1, scenes: { $slice: 1 }, description: 1, estimatedTime: 1, uid: 1 }
  )
    .sort({ _id: 1 })
    .lean();
  const user = await User.findOne(
    { uid },
    { name: 1, uid: 1, pictureURL: 1 }
  ).lean();
  return addThumbs(scenarios.map((s) => ({ ...s, user })));
};

/**
 * Retrieves single scenario from database
 * @param {String} scenarioId MongoDB ID of scenario
 * @returns database scenario object
 */
export const retrieveScenario = async (scenarioId) => {
  const scenario = await Scenario.findById(scenarioId);
  return scenario;
};

/**
 * Retrieves scenarios from database
 * @param {String[]} scenarioIds MongoDB ID of scenarios
 * @returns database scenario objects
 */
export const retrieveScenarios = async (scenarioIds) => {
  const scenarios = await Scenario.find(
    { _id: { $in: scenarioIds } },
    { name: 1, scenes: { $slice: 1 }, description: 1, estimatedTime: 1, uid: 1 }
  ).lean();

  const uids = [...new Set(scenarios.map((s) => s.uid))];
  const users = await User.find(
    { uid: { $in: uids } },
    { name: 1, uid: 1, pictureURL: 1 }
  ).lean();
  const userMap = Object.fromEntries(users.map((u) => [u.uid, u]));

  const scenariosWithUser = scenarios.map((s) => ({
    ...s,
    user: userMap[s.uid],
  }));

  return addThumbs(scenariosWithUser);
};

/**
 * Retrieves the role list from the scenario
 * @param {String} scenarioId MongoDB ID of scenario
 * @returns an array of strings representing the roles in that scenario
 */
export const retrieveRoleList = async (scenarioId) => {
  const scenario = await Scenario.findById(scenarioId);
  return scenario?.roleList ?? [];
};

/**
 * Updates the name of a scenario in the database
 * @param {String} scenarioId MongoDB ID of scenario
 * @param {{name: String, description: String, estimatedTime: String}} updatedScenario updated scenario object
 * @returns updated database scenario object
 */
export const updateScenario = async (scenarioId, updatedScenario) => {
  const scenario = await getScenarioOrThrow(scenarioId);

  if (updatedScenario.name?.trim()) {
    scenario.name = updatedScenario.name;
  }

  if (updatedScenario.description !== undefined) {
    scenario.description = updatedScenario.description;
  }

  if (updatedScenario.estimatedTime !== undefined) {
    scenario.estimatedTime = updatedScenario.estimatedTime;
  }

  await scenario.save();
  return scenario;
};

/**
 * Resolves a scenario or throws a consistent domain error.
 *
 * @param {string} scenarioId - MongoDB ID of the scenario.
 * @returns {Promise<object>} The scenario document.
 */
const getScenarioOrThrow = async (scenarioId) => {
  const scenario = await Scenario.findById(scenarioId);
  if (!scenario) {
    throw new HttpError("scenario not found", 404);
  }
  return scenario;
};

/**
 * Merges new role names into an existing role list without creating
 * case-insensitive duplicates. Roles already present keep their existing
 * casing; new roles keep the casing they were given in.
 * @param {String[]} existingRoles role names already on the scenario
 * @param {String[]} newRoles role names to merge in
 * @returns {String[]} merged role list
 */
const mergeRoles = (existingRoles, newRoles) => {
  const merged = [...existingRoles];
  const seen = new Set(merged.map((r) => r.trim().toLowerCase()));
  for (const role of newRoles) {
    const key = role.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(role);
  }
  return merged;
};

/**
 * Merges new roles into a scenario's role list, keeping any existing roles
 * @param {String} scenarioId MongoDB ID of scenario
 * @param {Array} updatedRoleList role names to merge into the scenario's role list
 * @returns updated database scenario object
 */
export const updateRoleList = async (scenarioId, updatedRoleList) => {
  const scenario = await getScenarioOrThrow(scenarioId);
  scenario.roleList = mergeRoles(scenario.roleList, updatedRoleList);
  await scenario.save();
  return scenario;
};

/**
 * Creates a new role for a scenario
 * @param {String} scenarioId MongoDB ID of scenario
 * @param {String} role name of the role to add
 * @returns updated role list for the scenario
 */
export const createRole = async (scenarioId, role) => {
  const scenario = await getScenarioOrThrow(scenarioId);
  const merged = mergeRoles(scenario.roleList, [role.trim()]);
  if (merged.length !== scenario.roleList.length) {
    scenario.roleList = merged;
    await scenario.save();
  }
  return scenario.roleList;
};

/**
 * Deletes a role from a scenario and removes it from any scenes that reference it
 * @param {String} scenarioId MongoDB ID of scenario
 * @param {String} role name of the role to remove
 * @returns updated role list for the scenario
 */
export const deleteRole = async (scenarioId, role) => {
  const scenario = await getScenarioOrThrow(scenarioId);
  scenario.roleList = scenario.roleList.filter((r) => r !== role);
  await scenario.save();
  await Scene.updateMany(
    { _id: { $in: scenario.scenes } },
    { $pull: { roles: role } }
  );
  return scenario.roleList;
};

/**
 * Deletes a scenario from the database
 * @param {String} scenarioId MongoDB ID of scenario
 * @returns {Promise<Boolean>} True if successfully deleted, False if error
 */
export const deleteScenario = async (scenarioId) => {
  try {
    const res = await Scenario.findOneAndDelete({ _id: scenarioId });
    if (res === null) return false;

    const scenes = await Scene.find({ _id: { $in: res.scenes } });

    const fileRefDeltas = new Map();
    scenes.forEach((scene) => {
      (scene.components ?? []).forEach((component) => {
        if (hasFileRef(component)) {
          addDelta(fileRefDeltas, component.fileId, -1);
        }
      });
    });

    await Scene.deleteMany({ _id: { $in: res.scenes } });
    await applyReferenceDeltas(fileRefDeltas);

    return true;
  } catch {
    return false;
  }
};

/**
 * Gets the properties for a scenario
 * @param {String} sceneId MongoDB ID of scene
 * @returns properties for the scenario
 */
export const getProperties = async (scenarioId) => {
  const scenario = await getScenarioOrThrow(scenarioId);
  return scenario.stateVariables || [];
};

/**
 * Creates a new property for a scenario
 * @param {String} sceneId MongoDB ID of scene
 * @param {Object} property new property to be added
 * @returns updated properties for the scenario
 */
export const createProperty = async (scenarioId, property) => {
  // TODO Add validation for property (e.g. name should be unique)
  const scenario = await getScenarioOrThrow(scenarioId);

  // Generate uuid on the backend
  const propertyWithId = {
    ...property,
    id: uuidv4(),
  };
  scenario.stateVariables.push(propertyWithId);
  await scenario.save();
  return scenario.stateVariables;
};

/**
 * Edits a property for a scenario
 * @param {String} scenarioId MongoDB ID of scenario
 * @param {String} originalName name of the original property (legacy support)
 * @param {Object} newProperty property to replace previous
 * @returns updated properties for the scenario
 */
export const editProperty = async (scenarioId, originalName, newProperty) => {
  // TODO Add validation for property
  // (e.g. if name has changed, it should not conflict with existing names)
  const scenario = await getScenarioOrThrow(scenarioId);

  for (let i = 0; i < scenario.stateVariables.length; i++) {
    // Try to match by ID first (new format), then by name (legacy format)
    const match =
      (newProperty.id && scenario.stateVariables[i].id === newProperty.id) ||
      (!newProperty.id && originalName === scenario.stateVariables[i].name);

    if (match) {
      scenario.stateVariables[i] = newProperty;
      break;
    }
  }

  await scenario.save();
  return scenario.stateVariables;
};

/**
 * Deletes a property from a scenario
 * @param {String} scenarioId MongoDB ID of scenario
 * @param {String} propertyIdentifier name or ID of the property to be deleted
 * @returns updated properties for the scenario
 */
export const deleteProperty = async (scenarioId, propertyIdentifier) => {
  const scenario = await getScenarioOrThrow(scenarioId);
  scenario.stateVariables = scenario.stateVariables.filter(
    (state) =>
      state.name !== propertyIdentifier && state.id !== propertyIdentifier
  );
  await scenario.save();
  return scenario.stateVariables;
};
