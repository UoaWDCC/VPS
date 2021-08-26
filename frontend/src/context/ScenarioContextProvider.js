import React, { useState } from "react";
import { useGet } from "../hooks/crudHooks";
import ScenarioContext from "./ScenarioContext";

export default function ScenarioContextProvider({ children }) {
  const [currentScenario, setCurrentScenario] = useState(null);
  const [scenarios, setScenarios] = useState();
  const { reFetch } = useGet(`api/scenario`, setScenarios);

  return (
    <ScenarioContext.Provider
      value={{
        scenarios,
        setScenarios,
        reFetch,
        currentScenario,
        setCurrentScenario,
      }}
    >
      {children}
    </ScenarioContext.Provider>
  );
}
