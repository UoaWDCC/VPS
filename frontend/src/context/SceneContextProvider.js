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

  const currentSceneRef = useRef(currentScene);

  let getScenes = null;
  if (currentScenario) {
    getScenes = useGet(
      `api/scenario/${currentScenario._id}/scene`,
      setScenes,
      false
    );
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
    currentSceneRef.current = currentScene;
  }, [currentScene]);

  function updateComponentProperty(componentIndex, property, newValue) {
    const updatedComponents = currentScene.components;
    updatedComponents[componentIndex % updatedComponents.length][property] =
      newValue;
    currentSceneRef.current = currentScene;
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
        currentSceneRef,
        updateComponentProperty,
      }}
    >
      {children}
    </SceneContext.Provider>
  );
}
