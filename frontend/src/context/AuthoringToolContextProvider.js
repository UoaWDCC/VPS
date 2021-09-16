import React, { useState } from "react";
import AuthoringToolContext from "./AuthoringToolContext";

export default function AuthoringToolContextProvider({ children }) {
  const [select, setSelect] = useState(null);
  const [bounds, setBounds] = useState(null);
  const [scalable, setScalable] = useState(false);
  const [shiftPressed, setShiftPressed] = useState(false);

  function selectElement({ currentTarget }) {
    setScalable(currentTarget.firstElementChild.nodeName === "IMG");
    setSelect(currentTarget.id);
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
        scalable,
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
