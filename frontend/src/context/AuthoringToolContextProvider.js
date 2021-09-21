import React, { useState, useContext } from "react";
import AuthoringToolContext from "./AuthoringToolContext";
import SceneContext from "./SceneContext";

export default function AuthoringToolContextProvider({ children }) {
  const { currentScene, setCurrentScene } = useContext(SceneContext);

  const [select, setSelect] = useState(null);
  const [bounds, setBounds] = useState(null);
  const [shiftPressed, setShiftPressed] = useState(false);

  function selectElement({ currentTarget }) {
    const image = currentTarget.firstElementChild?.nodeName === "IMG";
    setSelect(image ? currentTarget.firstElementChild.id : currentTarget.id);
  }

  const clearElement = ({ target }) => {
    if (target.id === "canvas") {
      setSelect(null);
    }
  };

  function deleteElement() {
    if (select !== null) {
      console.log(currentScene.components);
      console.log(select);
      const updatedComponents = currentScene.components;
      console.log(updatedComponents.splice(select, 1));

      console.log(updatedComponents);

      setSelect(null);

      setCurrentScene({
        ...currentScene,
        components: updatedComponents,
      });
    }
  }

  return (
    <AuthoringToolContext.Provider
      value={{
        select,
        setSelect,
        selectElement,
        clearElement,
        bounds,
        setBounds,
        shiftPressed,
        setShiftPressed,
        deleteElement,
      }}
    >
      {children}
    </AuthoringToolContext.Provider>
  );
}
