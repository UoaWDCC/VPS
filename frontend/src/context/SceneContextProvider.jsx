import { useContext, useEffect, useRef, useState } from "react";
import { useGet } from "../hooks/crudHooks";
import useLocalStorage from "../hooks/useLocalStorage";
import AuthenticationContext from "./AuthenticationContext";
import ScenarioContext from "./ScenarioContext";
import SceneContext from "./SceneContext";

/**
 * This is a Context Provider made with the React Context API
 * SceneContextProvider allows access to scene info and the refetch function
 */
export default function SceneContextProvider({ children }) {
  const { currentScenario } = useContext(ScenarioContext);
  const { user } = useContext(AuthenticationContext);
  const [scenes, setScenes] = useState([]);
  const [currentScene, setCurrentScene] = useLocalStorage("currentScene", null);
  const [monitorChange, setMonitorChange] = useState(false);
  const [hasChange, setHasChange] = useState(false);

  const currentSceneRef = useRef(currentScene);

  const { reFetch } = useGet(
    `api/scenario/${currentScenario?._id}/scene/all`,
    setScenes,
    true,
    !currentScenario
  );

  useEffect(() => {
    reFetch();
  }, [user]);

  useEffect(() => {
    if (currentScenario) {
      reFetch();
    }
  }, [currentScenario?._id]);

  /**
   * monitorChange variable is used to determine
   * whether or not the current sceneContext is monitoring a scene for changes.
   * This variable is needed so that we only monitor for changes when in AuthoringTool Page
   * If monitorChange changes to True -> We are in AuthoringTool Page and we start to monitor
   * If monitorChange changes to Flase -> Changes has been persisted to the database or discarded
   * (without monitorChange, sceneSelection will update currentScene too)
   */
  useEffect(() => {
    if (!monitorChange) {
      setHasChange(false);
    }
  }, [monitorChange]);

  /**
   * currentScene is changed when new components are added
   * When changes are monitored and currentScene is updated, update the ref to point to the new currentScene object
   */
  useEffect(() => {
    if (monitorChange) {
      setHasChange(true);
    }
    currentSceneRef.current = currentScene;
  }, [currentScene]);

  function updateComponentProperty(componentIndex, property, newValue) {
    const updatedComponents = currentScene.components;
    updatedComponents[componentIndex][property] = newValue;
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
        reFetch,
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
