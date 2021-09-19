import React, { useContext } from "react";
import {
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
} from "@material-ui/core";
import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import FormatAlignLeftIcon from "@material-ui/icons/FormatAlignLeft";
import FormatAlignCenterIcon from "@material-ui/icons/FormatAlignCenter";
import FormatAlignRightIcon from "@material-ui/icons/FormatAlignRight";
import FormatAlignJustifyIcon from "@material-ui/icons/FormatAlignJustify";
import SceneContext from "../../../../../context/SceneContext";
import CustomTextFieldStyles from "../CustomPropertyInputStyles/CustomTextFieldStyles";
import CustomInputLabelStyles from "../CustomPropertyInputStyles/CustomInputLabelStyles";
import CustomCheckBoxStyles from "../CustomPropertyInputStyles/CustomCheckBoxStyles";

import styles from "../../../../../styling/CanvasSideBar.module.scss";
import useStyles from "./TextPropertiesComponent.styles";

const CustomTextField = CustomTextFieldStyles()(TextField);
const CustomInputLabel = CustomInputLabelStyles()(InputLabel);
const CustomCheckBox = CustomCheckBoxStyles()(Checkbox);
const sizes = [6, 8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 30, 36, 42, 48, 60, 72];

export default function TextPropertiesComponent({ component, componentIndex }) {
  const textComponentStyles = useStyles();
  const { currentScene, setCurrentScene } = useContext(SceneContext);

  function updateComponentProperty(property, newValue) {
    const updatedComponents = currentScene.components;
    updatedComponents[componentIndex][property] = newValue;

    setCurrentScene({
      ...currentScene,
      components: updatedComponents,
    });
  }

  // Potential properties
  // Text
  // Border
  // font size
  // font color
  // alignment
  // bold/italics?

  return (
    <>
      <FormControl fullWidth className={styles.componentProperty}>
        <CustomInputLabel shrink>Text</CustomInputLabel>
        <CustomTextField
          className={textComponentStyles.textArea}
          value={component.text}
          fullWidth
          multiline
          variant="outlined"
          rows={5}
          onChange={(event) =>
            updateComponentProperty("text", event.target.value)
          }
        />
      </FormControl>
      <div
        className={`${styles.componentProperty} ${textComponentStyles.inlineRow}`}
      >
        <FormControl>
          <CustomInputLabel shrink>Font size</CustomInputLabel>
          <Select
            className={styles.selectInput}
            value={component.fontSize}
            onChange={(event) =>
              updateComponentProperty("fontSize", event.target.value)
            }
          >
            {sizes.map((size) => {
              return <MenuItem value={size}>{size}</MenuItem>;
            })}
          </Select>
        </FormControl>
        <ToggleButtonGroup
          value={component.textAlign}
          exclusive
          size="small"
          onChange={(event, value) =>
            updateComponentProperty("textAlign", value)
          }
          aria-label="text alignment"
        >
          <ToggleButton value="left" aria-label="left aligned">
            <FormatAlignLeftIcon />
          </ToggleButton>
          <ToggleButton value="center" aria-label="centered">
            <FormatAlignCenterIcon />
          </ToggleButton>
          <ToggleButton value="right" aria-label="right aligned">
            <FormatAlignRightIcon />
          </ToggleButton>
          <ToggleButton value="justify" aria-label="justified">
            <FormatAlignJustifyIcon />
          </ToggleButton>
        </ToggleButtonGroup>
      </div>
      <FormControl fullWidth className={styles.componentProperty}>
        <CustomInputLabel shrink>Text Colour</CustomInputLabel>
        <Select
          className={styles.selectInput}
          value={component.color}
          onChange={(event) =>
            updateComponentProperty("color", event.target.value)
          }
        >
          <MenuItem value="black">Black</MenuItem>
          <MenuItem value="green">Green</MenuItem>
          <MenuItem value="red">Red</MenuItem>
          <MenuItem value="white">White</MenuItem>
        </Select>
      </FormControl>
      <FormControl fullWidth className={styles.componentProperty}>
        <FormControlLabel
          control={
            <CustomCheckBox
              checked={component.border}
              color="default"
              onChange={(event) =>
                updateComponentProperty("border", event.target.checked)
              }
            />
          }
          label="Include border"
        />
      </FormControl>
    </>
  );
}
