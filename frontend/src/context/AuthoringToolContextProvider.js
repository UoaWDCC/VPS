import React, { useState } from "react";
import AuthoringToolContext from "./AuthoringToolContext";

export default function AuthoringToolContextProvider({ children }) {
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
      }}
    >
      {children}
    </AuthoringToolContext.Provider>
  );
}
