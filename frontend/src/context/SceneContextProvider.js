import React, { useContext, useState } from "react";
import { useGet } from "../hooks/crudHooks";
import ScenarioContext from "./ScenarioContext";
import SceneContext from "./SceneContext";

export default function SceneContextProvider({ children }) {
  const { currentScenario } = useContext(ScenarioContext);
  const [scenes, setScenes] = useState([]);
  const [currentScene, setCurrentScene] = useState(null);
  let getScenes = null;
  if (currentScenario) {
    getScenes = useGet(`api/scenario/${currentScenario._id}/scene`, setScenes);
  }

  return (
    <SceneContext.Provider
      value={{
        scenes,
        setScenes,
        reFetch: getScenes?.reFetch,
        currentScene,
        setCurrentScene,
      }}
    >
      {children}
    </SceneContext.Provider>
  );
}
