import {
  InputLabel,
  InputAdornment,
  FormControl,
  FormControlLabel,
  Select,
  Checkbox,
  Box,
} from "@material-ui/core";
import TextField from "@material-ui/core/TextField";
import { withStyles } from "@material-ui/core/styles";
import { useContext, useState } from "react";
import SceneContext from "../../../../context/SceneContext";

import styles from "../../../../styling/CanvasSideBar.module.scss";
import CustomInputLabelStyles from "./CustomPropertyInputStyles/CustomInputLabelStyles";

const CustomInputLabel = CustomInputLabelStyles()(InputLabel);
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
  const [checked, setChecked] = useState([true, true, true]);
  const [allChecked, setAllChecked] = useState([true]);

  const handleCheckboxChange = (index) => {
    const newChecked = [...checked];
    newChecked[index] = !checked[index];
    setChecked(newChecked);

    const isAllChecked = newChecked.every((isChecked) => isChecked);
    setAllChecked(isAllChecked);
  };

  const handleAllToggle = () => {
    const newAllChecked = !allChecked;
    setAllChecked(newAllChecked);

    const newChecked = allChecked ? [false, false, false] : [true, true, true];
    setChecked(newChecked);
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
            <Select className={styles.selectInput}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      defaultChecked
                      checked={allChecked}
                      onChange={handleAllToggle}
                    />
                  }
                  label="All"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      defaultChecked
                      checked={checked[0]}
                      onChange={() => handleCheckboxChange(0)}
                    />
                  }
                  label="Doctor"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      defaultChecked
                      checked={checked[1]}
                      onChange={() => handleCheckboxChange(1)}
                    />
                  }
                  label="Nurse"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      defaultChecked
                      checked={checked[2]}
                      onChange={() => handleCheckboxChange(2)}
                    />
                  }
                  label="Pharmacist"
                />
              </div>
            </Select>
          </FormControl>
        </div>
      </div>
    </>
  );
}
