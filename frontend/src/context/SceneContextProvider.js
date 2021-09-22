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

  useEffect(() => {
    if (monitorChange) {
      setHasChange(true);
    }
    currentSceneComponentsRef.current = currentScene?.components;
  }, [currentScene]);

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
        setCurrentScene,
        hasChange,
        setHasChange,
        setMonitorChange,
        currentSceneComponentsRef,
        updateComponentProperty,
      }}
    >
      {children}
    </SceneContext.Provider>
  );
}
