import Scenario from "../models/scenario";

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

/**
 * Retrieves all scenarios authored by particular user
 * @param {String} uid ID of user
 * @returns list of database scenario objects
 */
const retrieveScenarioList = async (uid) => {
  return Scenario.find({ uid }, "name");
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
 * Updates the name of a scenario in the database
 * @param {String} scenarioId MongoDB ID of scenario
 * @param {{name: String}} updatedScenario updated scenario object
 * @returns updated database scenario object
 */
const updateScenario = async (scenarioId, updatedScenario) => {
  const scenario = await Scenario.findById(scenarioId);
  
  // define temperary variable to store old name incase new name is empty
  let previousName = scenario.name;
  scenario.name = updatedScenario.name;

  // if new name is empty, set name to old name
  if (scenario.name == "" || scenario.name == null || scenario.name.trim() === '') { 
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
  } catch (e) {
    return scenario;
  }
};

/**
 * Deletes a scenario from the database
 * @param {String} scenarioId MongoDB ID of scenario
 * @returns {Boolean} True if successfully deleted, False if error
 */
const deleteScenario = async (scenarioId) => {
  try {
    const scenario = await Scenario.findById(scenarioId);
    await scenario.remove();
    return true;
  } catch (e) {
    return false;
  }
};

export {
  createScenario,
  retrieveScenarioList,
  retrieveScenario,
  updateScenario,
  deleteScenario,
  updateDurations,
};
