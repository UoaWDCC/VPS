import React from "react";
import Menu from "@material-ui/core/Menu";

/**
 * Material-UI Menu component customised to work as a ContextMenu.
 *
 * @component
 * @example
 * const [position, setPosition] = useState(null);
 *
 * function handleContextMenu(event) {
 *   if (position == null)
 *    setPosition({x: event.clientX, y: event.clientY});
 *   else
 *    setPosition(null);
 * }
 *
 * return (
 *   <div onContextMenu={handleContextMenu}>
 *    <ContextMenu position={position} setPosition={setPosition}>
 *      <MenuItem onClick={()=>console.log("Edit")}>Edit</MenuItem>
 *    </ContextMenu>
 *    Right click me!
 *   </div>
 * );
 */

export default function ContextMenu({ children, position, setPosition }) {
  const handleClose = () => setPosition(null);

  return (
    <Menu
      open={position !== null}
      anchorReference="anchorPosition"
      anchorPosition={
        position !== null ? { left: position.x, top: position.y } : undefined
      }
      onClose={handleClose}
      onClick={handleClose}
    >
      {children}
    </Menu>
  );
}
