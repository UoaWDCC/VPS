import React, { useState } from "react";
import { useGet } from "../hooks/crudHooks";
import useLocalStorage from "../hooks/useLocalStorage";
import ScenarioContext from "./ScenarioContext";

/**
 * This is a Context Provider made with the React Context API
 * ScenarioContextProvider allows access to scenario info and the refetch function
 */
export default function ScenarioContextProvider({ children }) {
  const [currentScenario, setCurrentScenario] = useLocalStorage(
    "currentScenario",
    null
  );
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
