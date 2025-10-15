import Scenario from "../models/scenario.js";
import Scene from "../models/scene.js";
import { v4 as uuidv4 } from "uuid";

/**
 * Creates a scenario in the database
 * @param {String} name name of scenario
 * @param {String} uid ID of authoring user
 * @returns database scenario object
 */
const createScenario = async (name, uid) => {
  const dbScenario = new Scenario({
    name,
    uid,
  });
  await dbScenario.save();

  return dbScenario;
};

const addThumbs = async (scenarios) => {
  const scenarioData = await Promise.all(
    scenarios.map(async (scenario) => {
      if (!scenario.scenes || !scenario.scenes[0])
        return {
          _id: scenario._id,
          name: scenario.name,
          description: scenario.description,
          estimatedTime: scenario.estimatedTime,
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
      };
    })
  );
  return scenarioData;
};

/**
 * Retrieves all scenarios authored by particular user
 * @param {String} uid ID of user
 * @returns list of database scenario objects
 */
const retrieveScenarioList = async (uid) => {
  const scenarios = await Scenario.find(
    { uid },
    { name: 1, scenes: { $slice: 1 }, description: 1, estimatedTime: 1 }
  )
    .sort({ _id: 1 })
    .lean();
  return addThumbs(scenarios);
};

/**
 * Retrieves single scenario from database
 * @param {String} scenarioId MongoDB ID of scenario
 * @returns database scenario object
 */
const retrieveScenario = async (scenarioId) => {
  const scenario = await Scenario.findById(scenarioId);
  return scenario;
};

/**
 * Retrieves scenarios from database
 * @param {String[]} scenarioIds MongoDB ID of scenarios
 * @returns database scenario objects
 */
const retrieveScenarios = async (scenarioIds) => {
  const scenarios = await Scenario.find(
    { _id: { $in: scenarioIds } },
    { name: 1, scenes: { $slice: 1 }, description: 1, estimatedTime: 1 }
  );
  return addThumbs(scenarios);
};

/**
 * Retrieves the role list from the scenario
 * @param {String} scenarioId MongoDB ID of scenario
 * @returns an array of strings representing the roles in that scenario
 */
const retrieveRoleList = async (scenarioId) => {
  const scenario = await Scenario.findById(scenarioId);
  return scenario?.roleList ?? [];
};

/**
 * Updates the name of a scenario in the database
 * @param {String} scenarioId MongoDB ID of scenario
 * @param {{name: String, description: String, estimatedTime: String}} updatedScenario updated scenario object
 * @returns updated database scenario object
 */
const updateScenario = async (scenarioId, updatedScenario) => {
  const scenario = await Scenario.findById(scenarioId);

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
 * Updates scenario durations for users
 * @param {String} sceneId MongoDB ID of scene
 * @param {updatedDuration: Object} updatedDurations updated duration for a user
 * @returns updated database scene object
 */
const updateDurations = async (scenarioId, updatedDurations) => {
  // if we are updating name only, components will be null
  const scenario = await Scenario.findById(scenarioId);
  try {
    scenario.durations = scenario.durations.push(updatedDurations);
    await scenario.save();
    return scenario;
  } catch {
    return scenario;
  }
};

/**
 * Updates scenario durations for users
 * @param {String} sceneId MongoDB ID of scene
 * @param {updatedRoleList: Array} updatedRoleList updated role list for the scenario
 * @returns updated database scenario object
 */
const updateRoleList = async (scenarioId, updatedRoleList) => {
  // if we are updating name only, components will be null
  const scenario = await Scenario.findById(scenarioId);
  try {
    scenario.roleList = updatedRoleList;
    await scenario.save();
    return scenario;
  } catch {
    return scenario;
  }
};

/**
 * Deletes a scenario from the database
 * @param {String} scenarioId MongoDB ID of scenario
 * @returns {Promise<Boolean>} True if successfully deleted, False if error
 */
const deleteScenario = async (scenarioId) => {
  try {
    const res = await Scenario.findOneAndDelete({ _id: scenarioId });
    if (res !== null) {
      await Scene.deleteMany({ _id: { $in: res.scenes } });
      return true;
    }
    return false;
  } catch {
    return false;
  }
};

/**
 * Gets the state variables for a scenario
 * @param {String} sceneId MongoDB ID of scene
 * @returns state variables for the scenario
 */
const getStateVariables = async (scenarioId) => {
  const scenario = await Scenario.findById(scenarioId);
  return scenario.stateVariables || [];
};

/**
 * Creates a new state variable for a scenario
 * @param {String} sceneId MongoDB ID of scene
 * @param {Object} stateVariable new state variable to be added
 * @returns updated state variables for the scenario
 */
const createStateVariable = async (scenarioId, stateVariable) => {
  // TODO Add validation for state variable (e.g. name should be unique)
  const scenario = await Scenario.findById(scenarioId);
  try {
    // Generate uuid on the backend
    const stateVariableWithId = {
      ...stateVariable,
      id: uuidv4(),
    };
    scenario.stateVariables.push(stateVariableWithId);
    await scenario.save();
    return scenario.stateVariables;
  } catch {
    return scenario.stateVariables;
  }
};

/**
 * Edits a state variable for a scenario
 * @param {String} scenarioId MongoDB ID of scenario
 * @param {String} originalName name of the original state variable (legacy support)
 * @param {Object} newStateVariable state variable to replace previous
 * @returns updated state variables for the scenario
 */
const editStateVariable = async (
  scenarioId,
  originalName,
  newStateVariable
) => {
  // TODO Add validation for state variable
  // (e.g. if name has changed, it should not conflict with existing names)
  const scenario = await Scenario.findById(scenarioId);
  try {
    for (let i = 0; i < scenario.stateVariables.length; i++) {
      // Try to match by ID first (new format), then by name (legacy format)
      const match =
        (newStateVariable.id &&
          scenario.stateVariables[i].id === newStateVariable.id) ||
        (!newStateVariable.id &&
          originalName === scenario.stateVariables[i].name);

      if (match) {
        scenario.stateVariables[i] = newStateVariable;
        break;
      }
    }

    await scenario.save();
    return scenario.stateVariables;
  } catch {
    return scenario.stateVariables;
  }
};

/**
 * Deletes a state variable from a scenario
 * @param {String} scenarioId MongoDB ID of scenario
 * @param {String} stateVariableIdentifier name or ID of the state variable to be deleted
 * @returns updated state variables for the scenario
 */
const deleteStateVariable = async (scenarioId, stateVariableIdentifier) => {
  const scenario = await Scenario.findById(scenarioId);
  try {
    scenario.stateVariables = scenario.stateVariables.filter(
      (state) =>
        state.name !== stateVariableIdentifier &&
        state.id !== stateVariableIdentifier
    );
    await scenario.save();
    return scenario.stateVariables;
  } catch {
    return scenario.stateVariables;
  }
};

export {
  createScenario,
  deleteScenario,
  retrieveRoleList,
  retrieveScenario,
  retrieveScenarioList,
  retrieveScenarios,
  updateDurations,
  updateRoleList,
  updateScenario,
  getStateVariables,
  createStateVariable,
  editStateVariable,
  deleteStateVariable,
};
