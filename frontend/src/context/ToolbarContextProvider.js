import React, { useState } from "react";
import ToolbarContext from "./ToolbarContext";

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
