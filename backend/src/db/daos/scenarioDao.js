import Scenario from "../models/scenario.js";
import Scene from "../models/scene.js";

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
        return { _id: scenario._id, name: scenario.name };
      const thumbnail = await Scene.findById(scenario.scenes[0], {
        components: 1,
        _id: 0,
      }).lean();
      return { _id: scenario._id, name: scenario.name, thumbnail };
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
    { name: 1, scenes: { $slice: 1 } }
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
    { name: 1, scenes: { $slice: 1 } }
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
 * @param {{name: String}} updatedScenario updated scenario object
 * @returns updated database scenario object
 */
const updateScenario = async (scenarioId, updatedScenario) => {
  const scenario = await Scenario.findById(scenarioId);

  // define temperary variable to store old name incase new name is empty
  const previousName = scenario.name;
  scenario.name = updatedScenario.name;

  // if new name is empty, set name to old name
  if (
    scenario.name === "" ||
    scenario.name == null ||
    scenario.name.trim() === ""
  ) {
    scenario.name = previousName;
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
    scenario.stateVariables.push(stateVariable);
    await scenario.save();
    return scenario.stateVariables;
  } catch {
    return scenario.stateVariables;
  }
};

/**
 * Edits a state variable for a scenario
 * @param {String} scenarioId MongoDB ID of scenario
 * @param {String} originalName name of the original state variable
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
    scenario.stateVariables = scenario.stateVariables.map((state) => {
      if (state.name === originalName) {
        return newStateVariable;
      } else {
        return state;
      }
    });
    await scenario.save();
    return scenario.stateVariables;
  } catch {
    return scenario.stateVariables;
  }
};

/**
 * Deletes a state variable from a scenario
 * @param {String} scenarioId MongoDB ID of scenario
 * @param {String} stateVariableName name of the state variable to be deleted
 * @returns updated state variables for the scenario
 */
const deleteStateVariable = async (scenarioId, stateVariableName) => {
  const scenario = await Scenario.findById(scenarioId);
  try {
    scenario.stateVariables = scenario.stateVariables.filter(
      (state) => state.name !== stateVariableName
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
