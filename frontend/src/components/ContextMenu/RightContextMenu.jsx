import React from "react";
import { render } from "./portal";

const RightContextMenu = ({ menu, children }) => {
  const handle = (event) => {
    event.preventDefault();
    render({ menu, position: { x: event.clientX, y: event.clientY } });
  };

  return (
    <div className="context-wrapper" onContextMenu={handle}>
      {children}
    </div>
  );
};

export default RightContextMenu;
