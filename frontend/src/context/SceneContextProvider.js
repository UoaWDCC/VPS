import React, { useContext, useEffect, useState } from "react";
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
  }

  function updateComponentProperty(componentIndex, property, newValue) {
    const updatedComponents = currentScene.components;
    updatedComponents[componentIndex][property] = newValue;

    setCurrentScene({
      ...currentScene,
      components: updatedComponents,
    });
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
        updateComponentProperty,
      }}
    >
      {children}
    </SceneContext.Provider>
  );
}
