import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useGet } from "../hooks/crudHooks";
import PlayScenarioContext from "./PlayScenarioContext";

/**
 * This is a Context Provider made with the React Context API
 * PlayScenarioContextProvider allows access to the current scenarioId, current scenario Info and sceneID being played
 */
export default function PlayScenarioContextProvider({ children }) {
  // currentScenario could be 1.null (initial state) 2.[] (no scenes) 3.[obj,obj..]
  const [currentScenario, setCurrentScenario] = useState(null);
  const [currentSceneId, setCurrentSceneId] = useState(null);

  // urlSceneId is only used for the selection screen thumbnail, when a specific scene needs to be shown
  const { scenarioId, urlSceneId } = useParams();

  const getScenesFromHook = useGet(
    `api/scenario/${scenarioId}/scene`,
    setCurrentScenario,
    false
  );

  useEffect(() => {
    if (urlSceneId) {
      setCurrentSceneId(urlSceneId);
    } else if (currentScenario) {
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
