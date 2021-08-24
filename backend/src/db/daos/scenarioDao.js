import Scenario from "../models/scenario";

const createScenario = async (name) => {
  const dbScenario = new Scenario({
    name,
  });
  await dbScenario.save();

  return dbScenario;
};

// eslint-disable-next-line import/prefer-default-export
export { createScenario };
