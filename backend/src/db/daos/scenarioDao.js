import Scenario from "../models/scenario";

const createScenario = async (name, uid) => {
  const dbScenario = new Scenario({
    name,
    uid,
  });
  await dbScenario.save();

  return dbScenario;
};

const retrieveScenarioList = async (uid) => {
  return Scenario.find({ uid }, "name");
};

const updateScenario = async (scenarioId, updatedScenario) => {
  const scenario = await Scenario.findById(scenarioId);
  scenario.name = updatedScenario.name;
  await scenario.save();
  return scenario;
};

const deleteScenario = async (scenarioId) => {
  try {
    const scenario = await Scenario.findById(scenarioId);
    await scenario.remove();
    return true;
  } catch (e) {
    return false;
  }
};

export { createScenario, retrieveScenarioList, updateScenario, deleteScenario };
