import {
  InputLabel,
  FormControl,
  FormControlLabel,
  Select,
  Checkbox,
  Typography,
} from "@material-ui/core";
import TextField from "@material-ui/core/TextField";
import { withStyles } from "@material-ui/core/styles";
import { useContext, useState, useEffect } from "react";
import ScenarioContext from "context/ScenarioContext";
import SceneContext from "context/SceneContext";
import {
  isSceneNameDuplicate,
  generateUniqueSceneName,
} from "../../../utils/sceneUtils";

import styles from "./CanvasSideBar.module.scss";
import CustomInputLabelStyles from "./CustomPropertyInputStyles/CustomInputLabelStyles";
import CustomCheckBoxStyles from "./CustomPropertyInputStyles/CustomCheckBoxStyles";
import useVisualScene from "../stores/visual";
import { modifyComponentProp } from "../scene/operations/component";
import { modifySceneProp } from "../scene/operations/modifiers";
import shallow from "zustand/shallow";

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
  const { scenes } = useContext(SceneContext);
  const { roleList } = useContext(ScenarioContext);

  const name = useVisualScene(scene => scene.name);
  const roles = useVisualScene(scene => scene.roles);

  const [selectedRoles, setSelectedRoles] = useState(roles ?? []);
  const [sceneName, setSceneName] = useState(name ?? "");

  useEffect(() => {
    if (!name || name === sceneName) return;
    setSceneName(name);
  }, [name]);

  useEffect(() => {
    if (!roleList || !roles) return;
    const selected = roleList.filter(role => roles.includes(role));
    if (!shallow(selected, selectedRoles)) setSelectedRoles(selected);
  }, [roleList, roles]);

  function saveSceneRoles(roles) {
    modifySceneProp("roles", roles);
  }

  function saveSceneName(name) {
    if (!name?.length) {
      alert("Scene name cannot be empty.");
      return;
    }

    let final = name;
    const { id: sceneId } = useVisualScene.getState();
    if (isSceneNameDuplicate(name, scenes, sceneId)) {
      console.log("duplicate found, generating unique name...");
      const unique = generateUniqueSceneName(scenes, name);
      alert(`"${name}" already exists, renamed to "${unique}".`);
      final = unique;
    }

    modifySceneProp("name", final);
  };

  function changeSceneName(e) {
    setSceneName(e.target.value);
  }

  function toggleRole(role, val) {
    if (val) setSelectedRoles(prev => [...prev, role]);
    else setSelectedRoles(prev => prev.filter(r => r !== role))
  }

  return (
    <>
      <div className={styles.sceneSettingsContainer}>
        <h1 className={styles.sideBarHeader}>Scene Settings</h1>
        <div className={styles.sideBarBody}>
          {/* input for scene name */}
          <CustomTextField
            label="Scene Name"
            value={sceneName}
            fullWidth
            onChange={changeSceneName}
            onBlur={() => saveSceneName(sceneName.trim())}
          />
          {/* input for scene roles */}
          <FormControl fullWidth className={styles.formControl}>
            <CustomInputLabel>Scene Role(s)</CustomInputLabel>
            <Select
              className={styles.selectInput}
              MenuProps={{
                getContentAnchorEl: null,
              }}
              multiple
              value={selectedRoles}
              onBlur={() => saveSceneRoles(selectedRoles)}
              renderValue={(selected) => selected.join(", ")}
            >
              {roleList?.length ? (
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {roleList.map((role, index) => (
                    <FormControlLabel
                      control={
                        <CustomCheckBox
                          checked={selectedRoles?.includes(role)}
                          onChange={(_, val) => toggleRole(role, val)}
                        />
                      }
                      label={role}
                      key={index}
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
