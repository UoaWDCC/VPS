import {
  InputLabel,
  InputAdornment,
  FormControl,
  FormControlLabel,
  Select,
  Checkbox,
  MenuItem,
} from "@material-ui/core";
import TextField from "@material-ui/core/TextField";
import { withStyles } from "@material-ui/core/styles";
import { useContext, useState } from "react";
import ScenarioContext from "context/ScenarioContext";
import SceneContext from "../../../../context/SceneContext";

import styles from "../../../../styling/CanvasSideBar.module.scss";
import CustomInputLabelStyles from "./CustomPropertyInputStyles/CustomInputLabelStyles";
import CustomCheckBoxStyles from "./CustomPropertyInputStyles/CustomCheckBoxStyles";

const CustomInputLabel = CustomInputLabelStyles()(InputLabel);
const CustomCheckBox = CustomCheckBoxStyles()(Checkbox);
const CustomTextField = withStyles({
  root: {
    marginTop: "0.5em",
    marginBottom: "1em",

    "& label.Mui-focused": {
      color: "#0080a7 ",
    },
    "& .MuiInput-underline:after": {
      borderBottomColor: "0080a7",
    },
  },
})(TextField);

/**
 * This component displays the settings of a scene, such as the scene name
 * @component
 */
export default function SceneSettings() {
  const { currentScene, setCurrentScene } = useContext(SceneContext);
  const { roleList } = useContext(ScenarioContext);

  // TODO: Fetch actual selected roles from the backend
  const [selectedRoles, setSelectedRoles] = useState([
    "Doctor",
    "Nurse",
    "Pharmacist",
  ]);

  const initialCheckedState = roleList?.map((role) =>
    selectedRoles?.includes(role)
  );
  const initialAllCheckedState = initialCheckedState.every(
    (checked) => checked
  );

  const [checked, setChecked] = useState(initialCheckedState);
  const [allChecked, setAllChecked] = useState(initialAllCheckedState);

  const handleCheckboxChange = (index) => {
    const newChecked = [...checked];
    newChecked[index] = !checked[index];
    setChecked(newChecked);

    const isAllChecked = newChecked.every((isChecked) => isChecked);
    setAllChecked(isAllChecked);

    const updatedSelectedRoles = newChecked.reduce((acc, isChecked, idx) => {
      if (isChecked) {
        acc.push(roleList[idx]);
      }
      return acc;
    }, []);
    setSelectedRoles(updatedSelectedRoles);
  };

  const handleAllToggle = () => {
    const newAllChecked = !allChecked;
    setAllChecked(newAllChecked);

    const newChecked = newAllChecked
      ? new Array(roleList.length).fill(true)
      : new Array(roleList.length).fill(false);
    setChecked(newChecked);

    const newSelectedRoles = newAllChecked ? roleList : [];
    setSelectedRoles(newSelectedRoles);
  };

  return (
    <>
      <div className={styles.sceneSettingsContainer}>
        <h1 className={styles.sideBarHeader}>Scene Settings</h1>
        <div className={styles.sideBarBody}>
          {/* input for scene name */}
          <CustomTextField
            label="Scene Name"
            value={currentScene?.name}
            fullWidth
            onChange={(event) => {
              setCurrentScene({
                ...currentScene,
                name: event.target.value,
              });
            }}
          />
          {/* input for scene timer duration */}
          <CustomTextField
            label="Scene Timer Duration"
            type="number"
            value={currentScene?.time || ""}
            fullWidth
            onChange={(event) => {
              // limiting scene timer duration
              const timeInput = event.target.value < 0 ? 0 : event.target.value;

              setCurrentScene({
                ...currentScene,
                time: timeInput,
              });
            }}
            InputProps={{
              // seconds adornment appears when there is input
              endAdornment: currentScene?.time ? (
                <InputAdornment position="end">seconds</InputAdornment>
              ) : null,
            }}
            InputLabelProps={{
              // label moves up whenever there is input
              shrink: !!currentScene?.time,
            }}
          />
          <FormControl fullWidth>
            <CustomInputLabel>Scene Role(s)</CustomInputLabel>
            <Select
              className={styles.selectInput}
              value={selectedRoles}
              onChange={(event) => setSelectedRoles(event.target.value)}
              renderValue={(selected) =>
                selected.length === roleList.length
                  ? "All"
                  : selected.join(", ")
              }
            >
              {roleList && roleList.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <FormControlLabel
                    control={
                      <CustomCheckBox
                        defaultChecked
                        checked={allChecked}
                        onChange={handleAllToggle}
                      />
                    }
                    label="All"
                  />
                  {roleList.map((role, index) => (
                    <FormControlLabel
                      control={
                        <CustomCheckBox
                          defaultChecked
                          checked={checked[index]}
                          onChange={() => handleCheckboxChange(index)}
                        />
                      }
                      label={role}
                    />
                  ))}
                </div>
              ) : (
                <MenuItem>
                  This scenario currently does not accommodate roles. Please
                  upload a CSV file first under Manage Groups.
                </MenuItem>
              )}
            </Select>
          </FormControl>
        </div>
      </div>
    </>
  );
}
