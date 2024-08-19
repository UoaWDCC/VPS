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
import SceneContext from "../../../../../context/SceneContext";
import CustomInputLabelStyles from "../CustomPropertyInputStyles/CustomInputLabelStyles";
import CustomTextFieldStyles from "../CustomPropertyInputStyles/CustomTextFieldStyles";
import CustomCheckBoxStyles from "../CustomPropertyInputStyles/CustomCheckBoxStyles";

import styles from "../../../../../styling/CanvasSideBar.module.scss";

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
  const { scenes, updateComponentProperty } = useContext(SceneContext);

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
        <Select
          className={styles.selectInput}
          value={component.colour}
          onChange={(event) =>
            updateComponentProperty(
              componentIndex,
              "colour",
              event.target.value
            )
          }
        >
          <MenuItem value="white">White</MenuItem>
          <MenuItem value="teal">Teal</MenuItem>
        </Select>
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
        <CustomTextField
          label="Z Axis Position"
          type="number"
          value={component?.zPosition || ""}
          fullWidth
          onChange={(event) =>
            updateComponentProperty(
              componentIndex,
              "zPosition",
              event.target.value
            )
          }
          InputLabelProps={{
            // label moves up whenever there is input
            shrink: !!component.zPosition,
          }}
        />
      </FormControl>
    </>
  );
}
