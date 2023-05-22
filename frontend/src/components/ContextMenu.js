import React from "react";
import Menu from "@material-ui/core/Menu";

/**
 * Material-UI Menu component customised to work as a ContextMenu.
 *
 * @component
 * @example
 * const items = [ <MenuItem onClick={()=>console.log("Edit")} key="1">Edit</MenuItem> ];
 * const [position, setPosition] = useState(null);
 *
 * function handleContextMenu(event) {
 *   if (position == null)
 *    setPosition({x: event.clientX, y: event.clientY});
 *   else
 *    setPosition(null)'
 * }
 *
 * return (
 *   <div onContextMenu={handleContextMenu}>
 *    <ContextMenu items={items} position={position} setPosition={setPosition} />
 *    Right click me!
 *   </div>
 * );
 */

export default function ContextMenu({ items, position, setPosition }) {
  const handleClose = () => setPosition(null);

  return (
    <Menu
      open={position !== null}
      anchorReference="anchorPosition"
      anchorPosition={
        position !== null ? { left: position.x, top: position.y } : undefined
      }
      onClose={handleClose}
    >
      {items.map((item) =>
        // on click, also close contextmenu
        React.cloneElement(item, {
          onClick: (event) => {
            if (item.props.onClick != null) item.props.onClick(event);
            handleClose();
          },
        })
      )}
    </Menu>
  );
}
