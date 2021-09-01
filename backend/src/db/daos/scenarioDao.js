import Scenario from "../models/scenario";

const createScenario = async (name) => {
  const dbScenario = new Scenario({
    name,
  });
  await dbScenario.save();

  return dbScenario;
};

const retrieveScenarioList = async () => {
  return Scenario.find({}, "name");
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

export { createScenario, retrieveScenarioList, deleteScenario };
