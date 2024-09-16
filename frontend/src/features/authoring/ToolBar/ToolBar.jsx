import { useContext } from "react";

import { Box, Button, Menu, MenuList, Tooltip } from "@material-ui/core";
import ArrowDropDownIcon from "@material-ui/icons/ArrowDropDown";

import AuthoringToolContext from "context/AuthoringToolContext";
import SceneContext from "context/SceneContext";
import ToolbarContext from "context/ToolbarContext";
import styles from "./ToolBar.module.scss";
import toolBarData from "./ToolBarData";

/**
 * Toolbar with icons for adding scene components
 * @component
 */
export default function ToolBar() {
  const { currentScene, setCurrentScene } = useContext(SceneContext);
  const { setSelect } = useContext(AuthoringToolContext);
  const { anchorEl, triggerElTitle, handleDropdownClick, handleDropdownClose } =
    useContext(ToolbarContext);

  return (
    <>
      <MenuList className={styles.toolBar}>
        <Box
          display="flex"
          flexDirection="row"
          onClick={() => {
            setSelect(null);
          }}
        >
          {toolBarData.map((tool) => {
            const menuOnClick = tool.dropdown
              ? (event) => {
                  handleDropdownClick(event, tool.title);
                }
              : () => tool.onClick(currentScene, setCurrentScene);
            return (
              <div key={tool.title}>
                <Tooltip title={tool.title} enterDelay={200} key={tool.title}>
                  <Button
                    className={styles.menuItem}
                    key={tool.title}
                    onClick={menuOnClick}
                  >
                    {tool.icon} <p>Add {tool.title}</p>
                    {tool.dropdown && <ArrowDropDownIcon fontSize="small" />}
                  </Button>
                </Tooltip>
                {tool.dropdown && (
                  <SubMenu
                    tool={tool}
                    open={tool.title === triggerElTitle}
                    anchorEl={anchorEl}
                    handleDropdownClose={handleDropdownClose}
                  />
                )}
              </div>
            );
          })}
        </Box>
      </MenuList>
    </>
  );
}

// This is the tool dropdown
// It is only rendered when the tool component has a dropdown
const SubMenu = ({ tool, open, anchorEl, handleDropdownClose }) => {
  return (
    <Menu
      id={tool.title}
      open={open}
      anchorEl={anchorEl}
      getContentAnchorEl={null}
      onClose={handleDropdownClose}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "left",
      }}
      transformOrigin={{
        vertical: "top",
        horizontal: "left",
      }}
    >
      {tool.dropdown.map((dropdown, index) => {
        // eslint-disable-next-line react/no-array-index-key
        return <div key={index}>{dropdown.component}</div>;
      })}
    </Menu>
  );
};
