import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useGet } from "../hooks/crudHooks";
import PlayScenarioContext from "./PlayScenarioContext";

export default function PlayScenarioContextProvider({ children }) {
  const [currentScenario, setCurrentScenario] = useState(null);
  const [currentSceneId, setCurrentSceneId] = useState(null);
  const { scenarioId } = useParams();

  const getScenesFromHook = useGet(
    `api/scenario/${scenarioId}/scene`,
    setCurrentScenario
  );

  console.log("=============================");
  console.log(currentScenario);

  useEffect(() => {
    if (currentScenario) {
      setCurrentSceneId(currentScenario[0]?._id);
    }
  }, [currentScenario]);

  return (
    <PlayScenarioContext.Provider
      value={{
        scenarioId,
        currentScenario,
        currentSceneId,
        setCurrentSceneId,
        reFetch: getScenesFromHook?.reFetch,
      }}
    >
      {children}
    </PlayScenarioContext.Provider>
  );
}
