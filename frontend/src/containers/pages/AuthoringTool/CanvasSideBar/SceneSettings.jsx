import {
  InputLabel,
  InputAdornment,
  FormControl,
  FormControlLabel,
  Select,
  Checkbox,
  Typography,
} from "@material-ui/core";
import { useParams } from "react-router-dom";
import { usePut } from "hooks/crudHooks";
import AuthenticationContext from "context/AuthenticationContext";
import TextField from "@material-ui/core/TextField";
import { withStyles } from "@material-ui/core/styles";
import { useContext, useState, useEffect } from "react";
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
  const [selectedRoles, setSelectedRoles] = useState([]);

  const [checked, setChecked] = useState([]);
  const [allChecked, setAllChecked] = useState(false);

  useEffect(() => {
    if (currentScene.roles) {
      setSelectedRoles(currentScene.roles);
    }
    if (roleList.length > 0) {
      const initialCheckedState = roleList.map((role) =>
        (currentScene.roles || []).includes(role)
      );
      setChecked(initialCheckedState);

      // Initialize allChecked state
      const initialAllCheckedState = initialCheckedState.every(
        (check) => check
      );
      setAllChecked(initialAllCheckedState);
    }
  }, [roleList, currentScene.roles]);

  const { scenarioId } = useParams();
  const { scenes } = useContext(SceneContext);
  const { getUserIdToken } = useContext(AuthenticationContext);
  async function saveRoles(newRoles) {
    const updatedScenes = scenes.map(({ _id, name, roles: oldRoles }) => {
      if (_id === currentScene._id) {
        const roles = newRoles || oldRoles;
        return {
          _id,
          name,
          roles,
        };
      }
      return { _id, name, roles: oldRoles };
    });
    await usePut(
      `/api/scenario/${scenarioId}/scene/roles`,
      updatedScenes,
      getUserIdToken
    );
  }

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
    saveRoles(updatedSelectedRoles);
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
    saveRoles(newSelectedRoles);
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
            value={currentScene?.time ?? 0}
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
              endAdornment: (
                <InputAdornment position="end">seconds</InputAdornment>
              ),
            }}
            InputLabelProps={{
              shrink: true,
            }}
          />
          <FormControl fullWidth className={styles.formControl}>
            <CustomInputLabel>Scene Role(s)</CustomInputLabel>
            <Select
              className={styles.selectInput}
              MenuProps={{
                getContentAnchorEl: null,
              }}
              multiple
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
                          checked={checked[index]}
                          onChange={() => handleCheckboxChange(index)}
                        />
                      }
                      label={role}
                    />
                  ))}
                </div>
              ) : (
                <Typography className={styles.menuItem}>
                  This scenario currently does not accommodate roles. Please
                  upload a CSV file first under Manage Groups.
                </Typography>
              )}
            </Select>
          </FormControl>
        </div>
      </div>
    </>
  );
}
