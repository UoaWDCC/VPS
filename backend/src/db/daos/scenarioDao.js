import Scenario from "../models/scenario";

const createScenario = async (name) => {
  const dbScenario = new Scenario({
    name,
  });
  await dbScenario.save();

  return dbScenario;
};

const retrieveScenarioList = async () => {
  return await Scenario.find({}, 'name');
};

// eslint-disable-next-line import/prefer-default-export
export { createScenario, 
  retrieveScenarioList };
