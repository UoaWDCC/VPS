import React, { useEffect, useState, useContext } from "react";
import { useGet } from "../hooks/crudHooks";
import useLocalStorage from "../hooks/useLocalStorage";
import ScenarioContext from "./ScenarioContext";
import AuthenticationContext from "./AuthenticationContext";

export default function ScenarioContextProvider({ children }) {
  const [currentScenario, setCurrentScenario] = useLocalStorage(
    "currentScenario",
    null
  );
  const { loading } = useContext(AuthenticationContext);
  const [scenarios, setScenarios] = useState();
  const { reFetch } = useGet(`api/scenario`, setScenarios);

  useEffect(() => {
    if (!loading) {
      reFetch();
    }
  }, [loading]);

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
