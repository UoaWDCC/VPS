import React, { useState } from "react";
import ScenarioContext from "./ScenarioContext";

export default function ScenarioContextProvider({ children }) {
  const [scenarios, setScenarios] = useState([]);
  const [currentScenario, setCurrentScenario] = useState();

  return (
    <ScenarioContext.Provider
      value={{
        scenarios,
        setScenarios,
        currentScenario,
        setCurrentScenario,
      }}
    >
      {children}
    </ScenarioContext.Provider>
  );
}
