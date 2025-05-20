import {
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  TextField,
  Typography,
} from "@material-ui/core";
import { useContext, useState } from "react";
import SceneContext from "context/SceneContext";
import CustomInputLabelStyles from "features/authoring/CanvasSideBar/CustomPropertyInputStyles/CustomInputLabelStyles";
import CustomTextFieldStyles from "features/authoring/CanvasSideBar/CustomPropertyInputStyles/CustomTextFieldStyles";
import CustomCheckBoxStyles from "features/authoring/CanvasSideBar/CustomPropertyInputStyles/CustomCheckBoxStyles";

import {
  handleSendToBack,
  handleBringToFront,
  handleMoveBackward,
  handleMoveForward,
} from "./utils/zAxisUtils";

import ColourPickerComponent from "../../components/ColourPickerComponent";
import { ensureRgbObject } from "../../../../utils/colourUtils";

import styles from "../CanvasSideBar.module.scss";

const CustomTextField = CustomTextFieldStyles()(TextField);
const CustomInputLabel = CustomInputLabelStyles()(InputLabel);
const CustomCheckBox = CustomCheckBoxStyles()(Checkbox);

/**
 * This component displays the properties in the sidebar for a button scene component.
 * @component
 */
export default function ButtonPropertiesComponent({
  component,
  componentIndex,
}) {
  const { scenes, updateComponentProperty, currentScene } =
    useContext(SceneContext);

  const [newFlag, setNewFlag] = useState("");
  const [open, setOpen] = useState(false);

  const handleInputChange = (event) => {
    setNewFlag(event.target.value);
  };

  const handleAddFlag = () => {
    if (!component.flagAdditions) {
      updateComponentProperty(componentIndex, "flagAdditions", {});
    }
    if (!component.flagDeletions) {
      updateComponentProperty(componentIndex, "flagDeletions", {});
    }

    if (Object.keys(component.flagAdditions).includes(`${newFlag}`)) {
      setOpen(true);
      return;
    }

    if (newFlag.trim().length !== 0) {
      setNewFlag("");
      updateComponentProperty(componentIndex, "flagAdditions", {
        ...component.flagAdditions,
        [newFlag]: false,
      });
      updateComponentProperty(componentIndex, "flagDeletions", {
        ...component.flagDeletions,
        [newFlag]: false,
      });
    }
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleCheckboxChange = (flag, adding) => {
    if (adding) {
      updateComponentProperty(componentIndex, "flagAdditions", {
        ...component.flagAdditions,
        [flag]: !component.flagAdditions[flag],
      });
    } else {
      updateComponentProperty(componentIndex, "flagDeletions", {
        ...component.flagDeletions,
        [flag]: !component.flagDeletions[flag],
      });
    }
  };

  return (
    <>
      <CustomTextField
        label="Text"
        value={component.text}
        fullWidth
        onChange={(event) =>
          updateComponentProperty(componentIndex, "text", event.target.value)
        }
        className={styles.componentProperty}
      />
      <FormControl fullWidth className={styles.componentProperty}>
        <CustomInputLabel shrink>Variant</CustomInputLabel>
        <Select
          className={styles.selectInput}
          value={component.variant}
          onChange={(event) =>
            updateComponentProperty(
              componentIndex,
              "variant",
              event.target.value
            )
          }
        >
          <MenuItem value="contained">Contained</MenuItem>
          <MenuItem value="outlined">Outlined</MenuItem>
        </Select>
      </FormControl>
      <FormControl fullWidth className={styles.componentProperty}>
        <CustomInputLabel shrink>Colour</CustomInputLabel>
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
        <CustomInputLabel shrink>Linked Scene</CustomInputLabel>
        <Select
          className={styles.selectInput}
          value={component.nextScene}
          onChange={(event) =>
            updateComponentProperty(
              componentIndex,
              "nextScene",
              event.target.value
            )
          }
          displayEmpty
        >
          <MenuItem value="">
            <em>None</em>
          </MenuItem>
          {scenes.map((scene) => {
            return (
              <MenuItem key={scene._id} value={scene._id}>
                {scene.name}
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>

      <FormControl fullWidth className={styles.componentProperty}>
        <div style={{ display: "flex" }}>
          <CustomTextField
            label="New Flag"
            value={newFlag}
            fullWidth
            onChange={handleInputChange}
          />
          <Button onClick={handleAddFlag}>Add</Button>
        </div>
      </FormControl>

      <FormControl fullWidth className={styles.componentProperty}>
        <CustomInputLabel shrink className={styles.plusLabel}>
          Select flags to be added
        </CustomInputLabel>
        <Select
          multiple
          className={styles.selectInput}
          value={Object.keys(component.flagAdditions || {})}
          renderValue={(selected) =>
            selected.filter((flag) => component.flagAdditions[flag]).join(", ")
          }
          displayEmpty
        >
          {Object.keys(component.flagAdditions || {}).length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {Object.keys(component.flagAdditions).map((flag) => (
                <FormControlLabel
                  key={flag}
                  control={
                    <CustomCheckBox
                      checked={component.flagAdditions[flag]}
                      onChange={() => handleCheckboxChange(flag, true)}
                    />
                  }
                  label={<span className={styles.plusLabel}>{flag}</span>}
                />
              ))}
            </div>
          ) : (
            <Typography className={styles.menuItem}>
              This button property currently does not have any flags. Please add
              flags first using the text field above.
            </Typography>
          )}
        </Select>
      </FormControl>
      <FormControl fullWidth className={styles.componentProperty}>
        <CustomInputLabel shrink className={styles.minusLabel}>
          Select flags to be removed
        </CustomInputLabel>
        <Select
          multiple
          className={styles.selectInput}
          value={Object.keys(component.flagDeletions || {})}
          renderValue={(selected) =>
            selected.filter((flag) => component.flagDeletions[flag]).join(", ")
          }
          displayEmpty
        >
          {Object.keys(component.flagDeletions || {}).length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {Object.keys(component.flagDeletions).map((flag) => (
                <FormControlLabel
                  key={flag}
                  control={
                    <CustomCheckBox
                      checked={component.flagDeletions[flag]}
                      onChange={() => handleCheckboxChange(flag, false)}
                    />
                  }
                  label={<span className={styles.minusLabel}>{flag}</span>}
                />
              ))}
            </div>
          ) : (
            <Typography className={styles.menuItem}>
              This button property currently does not have any flags. Please add
              flags first using the text field above.
            </Typography>
          )}
        </Select>
        <Snackbar
          open={open}
          autoHideDuration={3000}
          onClose={handleClose}
          message="Flag already exists"
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
