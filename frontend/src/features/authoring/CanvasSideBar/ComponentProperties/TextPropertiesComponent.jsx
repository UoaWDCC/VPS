import {
  Checkbox,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  Button,
  Typography,
} from "@material-ui/core";
import FormatAlignCenterIcon from "@material-ui/icons/FormatAlignCenter";
import FormatAlignJustifyIcon from "@material-ui/icons/FormatAlignJustify";
import FormatAlignLeftIcon from "@material-ui/icons/FormatAlignLeft";
import FormatAlignRightIcon from "@material-ui/icons/FormatAlignRight";
import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import { useContext, useEffect, useRef } from "react";

import AuthoringToolContext from "context/AuthoringToolContext";
import SceneContext from "context/SceneContext";

import styles from "../CanvasSideBar.module.scss";
import CustomCheckBoxStyles from "features/authoring/CanvasSideBar/CustomPropertyInputStyles/CustomCheckBoxStyles";
import CustomInputLabelStyles from "features/authoring/CanvasSideBar/CustomPropertyInputStyles/CustomInputLabelStyles";
import useStyles from "./TextPropertiesComponent.styles";

import {
  handleSendToBack,
  handleBringToFront,
  handleMoveBackward,
  handleMoveForward,
} from "./utils/zAxisUtils";

import ColourPickerComponent from "../../components/ColourPickerComponent";
import { ensureRgbObject } from "../../../../utils/colourUtils";


const CustomInputLabel = CustomInputLabelStyles()(InputLabel);
const CustomCheckBox = CustomCheckBoxStyles()(Checkbox);
const sizes = [6, 8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 30, 36, 42, 48, 60, 72];
// export const reference = useRef(null);

/**
 * This component displays the properties in the sidebar for a text scene component.
 * @component
 */
export default function TextPropertiesComponent({ component, componentIndex }) {
  const textComponentStyles = useStyles();
  const { updateComponentProperty, currentScene } = useContext(SceneContext);

  const addPropertyRef = useContext(AuthoringToolContext)?.addPropertyRef;
  const textRef = useRef(null);

  useEffect(() => {
    if (addPropertyRef) {
      addPropertyRef("text", textRef);
    }
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
        <div style={{ marginTop: 8 }}>
          <ColourPickerComponent
            value={ensureRgbObject(component.colour)}
            onChange={(colour) =>
              updateComponentProperty(componentIndex, "colour", colour.rgb)
            }
          />
        </div>
      </FormControl>
      <FormControl fullWidth className={styles.componentProperty}>
        <FormControlLabel
          control={
            <CustomCheckBox
              checked={component.border}
              color="default"
              onChange={(event) =>
                updateComponentProperty(
                  componentIndex,
                  "border",
                  event.target.checked
                )
              }
            />
          }
          label="Show Background"
        />
      </FormControl>

      <FormControl fullWidth className={styles.componentProperty}>
        <CustomInputLabel shrink>Z Axis Position</CustomInputLabel>
        <Typography
          variant="body2"
          style={{
            marginTop: "0.5em",
            marginBottom: "0.5em",
            textAlign: "center",
          }}
        >
          Current Z: {component?.zPosition ?? 0}
        </Typography>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5em",
            marginTop: "0.5em",
            width: "100%",
          }}
        >
          <Button
            style={{ fontSize: "0.50rem" }}
            variant="outlined"
            onClick={() =>
              handleMoveBackward({
                component,
                componentIndex,
                updateComponentProperty,
              })
            }
          >
            Move Backward
          </Button>
          <Button
            style={{ fontSize: "0.50rem" }}
            variant="outlined"
            onClick={() =>
              handleMoveForward({
                component,
                componentIndex,
                updateComponentProperty,
              })
            }
          >
            Move Forward
          </Button>
          <Button
            style={{ fontSize: "0.50rem" }}
            variant="outlined"
            onClick={() =>
              handleSendToBack({
                currentScene,
                component,
                componentIndex,
                updateComponentProperty,
              })
            }
            fullWidth
          >
            Send to Back
          </Button>
          <Button
            style={{ fontSize: "0.50rem" }}
            variant="outlined"
            onClick={() =>
              handleBringToFront({
                currentScene,
                component,
                componentIndex,
                updateComponentProperty,
              })
            }
            fullWidth
          >
            Bring to Front
          </Button>
        </div>
      </FormControl>
    </>
  );
}
