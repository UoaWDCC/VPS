import React, { useState, useContext, useRef } from "react";
import AuthoringToolContext from "./AuthoringToolContext";
import SceneContext from "./SceneContext";

export default function AuthoringToolContextProvider({ children }) {
  const { currentScene, setCurrentScene, currentSceneComponentsRef } =
    useContext(SceneContext);

  const [select, setSelect] = useState(null);
  const [bounds, setBounds] = useState(null);
  const [shiftPressed, setShiftPressed] = useState(false);

  const selectRef = useRef(select);

  function selectElement({ currentTarget }) {
    const image = currentTarget.firstElementChild?.nodeName === "IMG";
    selectRef.current = image
      ? currentTarget.firstElementChild.id
      : currentTarget.id;
    setSelect(image ? currentTarget.firstElementChild.id : currentTarget.id);
  }

  const clearElement = ({ target }) => {
    if (target.id === "canvas") {
      setSelect(null);
      selectRef.current = null;
    }
  };

  function deleteElement() {
    console.log(selectRef);
    if (selectRef.current !== null) {
      const updatedComponents = currentSceneComponentsRef.current;
      updatedComponents.splice(parseInt(selectRef.current, 10), 1);

      setSelect(null);
      selectRef.current = null;

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
