import React, { useState } from "react";
import {
  Box,
  Tooltip,
  Button,
  MenuList,
  Menu,
  MenuItem,
} from "@material-ui/core";
import ImageIcon from "@material-ui/icons/Image";
import TextFieldsIcon from "@material-ui/icons/TextFields";
import VolumeUpIcon from "@material-ui/icons/VolumeUp";
import CloudQueueIcon from "@material-ui/icons/CloudQueue";
import PublishIcon from "@material-ui/icons/Publish";
import ArrowDropDownIcon from "@material-ui/icons/ArrowDropDown";
import styles from "../../../../styling/ToolBar.module.scss";

// Defines whats in side of the tool bar
// Two types of tool bar component:
// button = {
//   title: "Audio",
//   icon: <VolumeUpIcon fontSize="medium" />,
//   dropdown: {},
//   onClick: onClickCall,
// };
// dropdown = {
//   title: "Background Image",
//   icon: <ImageIcon fontSize="medium" />,
//   dropdown: {},
//   onClick: null,
// };

const ToolbarData = [
  {
    title: "Background Image",
    icon: <ImageIcon fontSize="medium" />,
    dropdown: [
      {
        title: "choose from bank",
        icon: <CloudQueueIcon fontSize="medium" />,
        onClick: () => {
          console.log("choose from bank");
        },
      },
      {
        title: "upload",
        icon: <PublishIcon fontSize="medium" />,
        onClick: () => {
          console.log("upload");
        },
      },
    ],
  },
  {
    title: "Text",
    icon: <TextFieldsIcon fontSize="medium" />,
    dropdown: [],
  },
  {
    title: "Audio",
    icon: <VolumeUpIcon fontSize="medium" />,
    onClick: () => {
      console.log("audio clicked");
    },
  },
];

export default function ToolBar() {
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
          {ToolbarData.map((tool) => {
            const menuOnClick = tool.dropdown
              ? (event) => {
                  handleDropdownClick(event, tool.title);
                }
              : tool.onClick;
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
      {tool.dropdown.map((dropdown) => {
        return (
          <Tooltip title={dropdown.title} enterDelay={200} key={dropdown.title}>
            <MenuItem
              className={styles.menuItem}
              key={dropdown.title}
              onClick={dropdown.menuOnClick}
            >
              {dropdown.icon}
              &nbsp;&nbsp;
              {dropdown.title}
            </MenuItem>
          </Tooltip>
        );
      })}
    </Menu>
  );
};
