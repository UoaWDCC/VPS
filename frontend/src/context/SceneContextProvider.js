import React, { useContext, useEffect, useState, useRef } from "react";
import { useGet } from "../hooks/crudHooks";
import useLocalStorage from "../hooks/useLocalStorage";
import ScenarioContext from "./ScenarioContext";
import SceneContext from "./SceneContext";

export default function SceneContextProvider({ children }) {
  const { currentScenario } = useContext(ScenarioContext);
  const [scenes, setScenes] = useState([]);
  const [currentScene, setCurrentScene] = useLocalStorage("currentScene", null);
  const [monitorChange, setMonitorChange] = useState(false);
  const [hasChange, setHasChange] = useState(false);

  const currentSceneComponentsRef = useRef(currentScene?.components);

  let getScenes = null;
  if (currentScenario) {
    getScenes = useGet(`api/scenario/${currentScenario._id}/scene`, setScenes);
  }

  useEffect(() => {
    if (!monitorChange) {
      setHasChange(false);
    }
  }, [monitorChange]);

  function changeScene(newScene) {
    if (monitorChange) {
      setHasChange(true);
    }
    setCurrentScene(newScene);
    currentSceneComponentsRef.current = newScene?.components;
  }

  return (
    <SceneContext.Provider
      value={{
        scenes,
        setScenes,
        reFetch: getScenes?.reFetch,
        currentScene,
        setCurrentScene: changeScene,
        hasChange,
        setHasChange,
        setMonitorChange,
        currentSceneComponentsRef,
      }}
    >
      {children}
    </SceneContext.Provider>
  );
}
