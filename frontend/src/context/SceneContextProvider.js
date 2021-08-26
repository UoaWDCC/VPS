import React, { useContext, useState } from "react";
import { useGet } from "../hooks/crudHooks";
import ScenarioContext from "./ScenarioContext";
import SceneContext from "./SceneContext";

export default function SceneContextProvider({ children }) {
  const { currentScenario } = useContext(ScenarioContext);
  const [scenes, setScenes] = useState([]);
  const [currentScene, setCurrentScene] = useState();
  let reFetch = null;
  if (currentScenario) {
    reFetch = useGet(`api/scenario/${currentScenario.id}/scene`, setScenes);
  }

  return (
    <SceneContext.Provider
      value={{
        scenes,
        setScenes,
        reFetch: reFetch?.reFetch,
        currentScene,
        setCurrentScene,
      }}
    >
      {children}
    </SceneContext.Provider>
  );
}
