import React, { useState } from "react";
import ToolbarContext from "./ToolbarContext";

/**
 * This is a Context Provider made with the React Context API
 * ToolbarContextProvider provides access to anchor element and trigger element of a dropdown (material ui)
 * as well as the event handler when dropdowns are clicked, and function to close the dropdown
 */
export default function ToolbarContextProvider({ children }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [triggerElTitle, setTriggerElTitle] = useState(null);

  const handleDropdownClick = (e, title) => {
    setTriggerElTitle(title);
    setAnchorEl(e.currentTarget);
  };

  const handleDropdownClose = () => {
    setTriggerElTitle(null);
    setAnchorEl(null);
  };

  return (
    <ToolbarContext.Provider
      value={{
        anchorEl,
        triggerElTitle,
        handleDropdownClick,
        handleDropdownClose,
      }}
    >
      {children}
    </ToolbarContext.Provider>
  );
}
