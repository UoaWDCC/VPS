import {
  Checkbox,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  TextField,
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
import CustomTextFieldStyles from "features/authoring/CanvasSideBar/CustomPropertyInputStyles/CustomTextFieldStyles";
import CustomInputLabelStyles from "features/authoring/CanvasSideBar/CustomPropertyInputStyles/CustomInputLabelStyles";
import useStyles from "./TextPropertiesComponent.styles";

const CustomTextField = CustomTextFieldStyles()(TextField);
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

  const handleSendToBack = () => {
    if (!currentScene || !currentScene.components) return;

    const zPositions = currentScene.components
      .map((c) => c.zPosition)
      .filter((z) => typeof z === "number");

    if (zPositions.length === 0 && (component?.zPosition ?? 0) === 0) {
      // Empty block from diff
    }

    const minZ = zPositions.length > 0 ? Math.min(...zPositions) : 0;

    if ((component?.zPosition ?? 0) === minZ) {
      if (zPositions.length > 0 || (component?.zPosition ?? 0) < 0) {
        return;
      }
    }
    if ((component?.zPosition ?? 0) < minZ) {
        return;
    }
    updateComponentProperty(componentIndex, "zPosition", minZ - 1);
  };

  const handleBringToFront = () => {
    if (!currentScene || !currentScene.components) return;

    const zPositions = currentScene.components
      .map((c) => c.zPosition)
      .filter((z) => typeof z === "number");

    const maxZ = zPositions.length > 0 ? Math.max(...zPositions) : 0;

    if ((component?.zPosition ?? 0) === maxZ) {
       if (zPositions.length > 0 || (component?.zPosition ?? 0) > 0) {
        return;
      }
    }
    if ((component?.zPosition ?? 0) > maxZ) {
        return;
    }
    updateComponentProperty(componentIndex, "zPosition", maxZ + 1);
  };

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
          label="Include border"
        />
      </FormControl>
      
      <FormControl fullWidth className={styles.componentProperty}>
        <CustomInputLabel shrink>Z Axis Position</CustomInputLabel>
        <Typography variant="body2" style={{ marginTop: "0.5em", marginBottom: "0.5em", textAlign: "center" }}>
          Current Z: {component?.zPosition ?? 0}
        </Typography>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5em" , marginTop: "0.5em", width: "100%"}}>
          <Button
            style={{ fontSize: "0.50rem" }}
            variant="outlined"
            onClick={() =>
              updateComponentProperty(
                componentIndex,
                "zPosition",
                (component?.zPosition ?? 0) - 1
              )
            }
          >
            Move Backward
          </Button>
          <Button
            style={{ fontSize: "0.50rem" }}
            variant="outlined"
            onClick={() =>
              updateComponentProperty(
                componentIndex,
                "zPosition",
                (component?.zPosition ?? 0) + 1
              )
            }
          >
            Move Forward
          </Button>
          <Button
            style={{ fontSize: "0.50rem" }}
            variant="outlined"
            onClick={handleSendToBack}
            fullWidth
          >
            Send to Back
          </Button>
          <Button
            style={{ fontSize: "0.50rem" }}
            variant="outlined"
            onClick={handleBringToFront}
            fullWidth
          >
            Bring to Front
          </Button>
        </div>
      </FormControl>
    </>
  );
}
