import React, { useState } from "react";
import SceneContext from "./SceneContext";

export default function SceneContextProvider({ children }) {
  const [scenes, setScenes] = useState([]);
  const [currentScene, setCurrentScene] = useState();

  return (
    <SceneContext.Provider
      value={{
        scenes,
        setScenes,
        currentScene,
        setCurrentScene,
      }}
    >
      {children}
    </SceneContext.Provider>
  );
}
