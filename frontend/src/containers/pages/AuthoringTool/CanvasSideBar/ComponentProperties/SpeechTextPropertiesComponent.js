import React, { useContext, useEffect, useRef } from "react";
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
} from "@material-ui/core";
import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import FormatAlignLeftIcon from "@material-ui/icons/FormatAlignLeft";
import FormatAlignCenterIcon from "@material-ui/icons/FormatAlignCenter";
import FormatAlignRightIcon from "@material-ui/icons/FormatAlignRight";
import FormatAlignJustifyIcon from "@material-ui/icons/FormatAlignJustify";
import SceneContext from "context/SceneContext";
import AuthoringToolContext from "context/AuthoringToolContext";

import styles from "styling/CanvasSideBar.module.scss";
import CustomInputLabelStyles from "../CustomPropertyInputStyles/CustomInputLabelStyles";
import useStyles from "./TextPropertiesComponent.styles";

const CustomInputLabel = CustomInputLabelStyles()(InputLabel);
const sizes = [6, 8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 30, 36, 42, 48, 60, 72];
// export const reference = useRef(null);

/**
 * This component displays the properties in the sidebar for a text scene component.
 * @component
 */
export default function SpeechTextPropertiesComponent({
  component,
  componentIndex,
}) {
  const textComponentStyles = useStyles();
  const { updateComponentProperty } = useContext(SceneContext);

  const { addPropertyRef } = useContext(AuthoringToolContext);
  const textRef = useRef(null);

  useEffect(() => {
    addPropertyRef("text", textRef);
  }, []);

  return (
    <>
      <FormControl fullWidth className={styles.componentProperty}>
        <CustomInputLabel shrink>Text</CustomInputLabel>
        <OutlinedInput
          className={textComponentStyles.textArea}
          value={component.text}
          inputRef={textRef}
          fullWidth
          multiline
          rows={5}
          onChange={(event) =>
            updateComponentProperty(componentIndex, "text", event.target.value)
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
              updateComponentProperty(
                componentIndex,
                "fontSize",
                event.target.value
              )
            }
          >
            {sizes.map((size) => {
              return (
                <MenuItem value={size} key={size}>
                  {size}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
        <ToggleButtonGroup
          value={component.textAlign}
          exclusive
          size="small"
          onChange={(event, value) =>
            updateComponentProperty(componentIndex, "textAlign", value)
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
            updateComponentProperty(componentIndex, "color", event.target.value)
          }
        >
          <MenuItem value="black">Black</MenuItem>
          <MenuItem value="green">Green</MenuItem>
          <MenuItem value="red">Red</MenuItem>
          <MenuItem value="white">White</MenuItem>
        </Select>
      </FormControl>
    </>
  );
}
