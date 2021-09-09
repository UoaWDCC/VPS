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
import styles from "../../../styling/ToolBar.module.scss";

const SidebarData = [
  {
    title: "Background Image",
    icon: <ImageIcon fontSize="medium" />,
    dropdown: {},
    onClick: null,
  },
  {
    title: "Text",
    icon: <TextFieldsIcon fontSize="medium" />,
    dropdown: {},
    onClick: null,
  },
  {
    title: "Audio",
    icon: <VolumeUpIcon fontSize="medium" />,
    dropdown: null,
    onClick: null,
  },
];

export default function ToolBar() {
  const [anchorEl, setAnchorEl] = useState(null);
  const handleDropdownClick = (e) => {
    setAnchorEl(e.currentTarget);
  };

  const handleDropdownClose = () => {
    setAnchorEl(null);
  };
  return (
    <>
      <MenuList className={styles.toolBar}>
        <Box display="flex" flexDirection="row">
          {SidebarData.map((val) => {
            const menuOnClick = val.dropdown
              ? handleDropdownClick
              : val.onClick;
            const open = val.title === anchorEl?.getAttribute("title");
            return (
              <>
                <Tooltip title={val.title} enterDelay={200} key={val.title}>
                  <Button
                    className={styles.menuItem}
                    key={val.title}
                    onClick={menuOnClick}
                  >
                    {val.icon}
                  </Button>
                </Tooltip>
                <Menu
                  id={val.title}
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
                  <MenuItem onClick={() => {}}>Profile</MenuItem>
                </Menu>
              </>
            );
          })}
        </Box>
      </MenuList>
    </>
  );
}
