import React, { useContext, useEffect, useState } from "react";
import { useGet } from "../hooks/crudHooks";
import PlayingScenarioContext from "./PlayingScenarioContext";
import SceneContext from "./SceneContext";

export default function SceneContextProvider({ children }) {
  const { currentScenario } = useContext(PlayingScenarioContext);

  let getScenes = null;
  if (currentScenario) {
    getScenes = useGet(`api/scenario/${currentScenario._id}/scene`, setScenes);
  }

  return (
    <SceneContext.Provider
      value={{
        currentScene,
        setCurrentScene: changeScene,
      }}
    >
      {children}
    </SceneContext.Provider>
  );
}
