import React, { useState, useContext, useRef } from "react";
import AuthoringToolContext from "./AuthoringToolContext";
import SceneContext from "./SceneContext";

/**
 * This is a Context Provider made with the React Context API
 * AuthoringToolContextProvider grants access to information related to AuthoringTool
 * This includes: component that are selected, state of whether or not SHIFT is pressed...etc
 */
export default function AuthoringToolContextProvider({ children }) {
  const { setCurrentScene, currentSceneRef } = useContext(SceneContext);

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
    if (selectRef.current !== null) {
      const updatedComponents = currentSceneRef.current.components;
      updatedComponents.splice(parseInt(selectRef.current, 10), 1);
      setSelect(null);
      selectRef.current = null;

      setCurrentScene({
        ...currentSceneRef.current,
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
