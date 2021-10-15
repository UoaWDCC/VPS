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
  scenario.name = updatedScenario.name;
  await scenario.save();
  return scenario;
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
};
