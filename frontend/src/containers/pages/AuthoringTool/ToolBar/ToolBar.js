import React, { useState, useContext } from "react";
import { Box, Tooltip, Button, MenuList, Menu } from "@material-ui/core";
import ArrowDropDownIcon from "@material-ui/icons/ArrowDropDown";
import toolBarData from "./ToolBarData";
import SceneContext from "../../../../context/SceneContext";
import styles from "../../../../styling/ToolBar.module.scss";

export default function ToolBar() {
  const { currentScene, setCurrentScene } = useContext(SceneContext);
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
    <>
      <MenuList className={styles.toolBar}>
        <Box display="flex" flexDirection="row">
          {toolBarData.map((tool) => {
            const menuOnClick = tool.dropdown
              ? (event) => {
                  handleDropdownClick(event, tool.title);
                }
              : () => tool.onClick(currentScene, setCurrentScene);
            const open = tool.title === triggerElTitle;
            return (
              <div key={tool.title}>
                <Tooltip title={tool.title} enterDelay={200} key={tool.title}>
                  <Button
                    className={styles.menuItem}
                    key={tool.title}
                    onClick={menuOnClick}
                  >
                    {tool.icon}
                    {tool.dropdown && <ArrowDropDownIcon fontSize="small" />}
                  </Button>
                </Tooltip>
                {tool.dropdown && (
                  <SubMenu
                    tool={tool}
                    open={open}
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
