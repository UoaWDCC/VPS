import Scenario from "../models/scenario";

async function createScenario(name) {
  const dbScenario = new Scenario({
    name,
  });
  await dbScenario.save();

  return dbScenario;
}

// eslint-disable-next-line import/prefer-default-export
export { createScenario };
