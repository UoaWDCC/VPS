import React, { useContext, useEffect, useState } from "react";
import { useGet } from "../hooks/crudHooks";
import PlayingScenarioContext from "./PlayingScenarioContext";

export default function PlayingScenarioContextProvider({ children }) {
  const [currentScenarioId, setCurrentScenarioId] = useState(null);
  const [currentScenario, setCurrentScenario] = useState(null);
  const [currentSceneId, setCurrentSceneId] = useState(null);

  console.log(`Context ScenarioId= ${currentScenarioId}`);
  console.log(currentScenario);
  console.log("=============================");

  const { reFetch } = useGet(
    `api/scenario/${currentScenarioId}/scene`,
    setCurrentScenario
  );

  useEffect(() => {
    if (currentScenarioId) {
      reFetch();
    }
  }, [currentScenarioId]);

  return (
    <PlayingScenarioContext.Provider
      value={{
        currentScenarioId,
        setCurrentScenarioId,
        currentScenario,
        currentSceneId,
      }}
    >
      {children}
    </PlayingScenarioContext.Provider>
  );
}
