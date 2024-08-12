import {
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
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

  const handleInputChange = (event) => {
    setNewFlag(event.target.value);
  };

  const handleAddFlag = () => {
    if (Object.keys(component.flagList).includes(`add ${newFlag}`)) {
      alert("Flag already exists in the flag list.");
      return;
    }

    if (newFlag.trim() !== "") {
      const newFlagList = {
        ...component.flagList,
        [`add ${newFlag}`]: false,
        [`remove ${newFlag}`]: false,
      };
      setNewFlag("");
      updateComponentProperty(componentIndex, "flagList", newFlagList);
    }
  };

  const handleCheckboxChange = (flag) => {
    const newFlagList = {
      ...component.flagList,
      [`${flag}`]: !component.flagList[flag],
    };
    updateComponentProperty(componentIndex, "flagList", newFlagList);

    // TODO:
    // Need to implement the functionality when
    // a checkbox is checked, the labelled flag should be
    // added to the groups active flag list
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

        <Select
          style={{ marginTop: "10px" }}
          multiple
          className={styles.selectInput}
          value={Object.keys(component.flagList)}
          renderValue={(selected) =>
            selected.filter((flag) => component.flagList[flag]).join(", ")
          }
          displayEmpty
        >
          {Object.keys(component.flagList).length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {Object.keys(component.flagList).map((flag) => (
                <FormControlLabel
                  key={flag}
                  control={
                    <CustomCheckBox
                      checked={component.flagList[flag]}
                      onChange={() => handleCheckboxChange(flag)}
                    />
                  }
                  label={flag}
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
