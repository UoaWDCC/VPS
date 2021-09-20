import React, { useContext } from "react";
import {
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@material-ui/core";
import SceneContext from "../../../../../context/SceneContext";
import CustomTextFieldStyles from "../CustomPropertyInputStyles/CustomTextFieldStyles";
import CustomInputLabelStyles from "../CustomPropertyInputStyles/CustomInputLabelStyles";

import styles from "../../../../../styling/CanvasSideBar.module.scss";

const CustomTextField = CustomTextFieldStyles()(TextField);
const CustomInputLabel = CustomInputLabelStyles()(InputLabel);

export default function ButtonPropertiesComponent({
  component,
  componentIndex,
}) {
  const { scenes, currentScene, setCurrentScene } = useContext(SceneContext);

  function updateComponentProperty(event, property) {
    const updatedComponents = currentScene.components;
    console.log(event.target.value);
    updatedComponents[componentIndex][property] = event.target.value;

    setCurrentScene({
      ...currentScene,
      components: updatedComponents,
    });
  }

  return (
    <>
      <CustomTextField
        label="Text"
        value={component.text}
        fullWidth
        onChange={(event) => updateComponentProperty(event, "text")}
        className={styles.componentProperty}
      />
      <FormControl fullWidth className={styles.componentProperty}>
        <CustomInputLabel shrink>Variant</CustomInputLabel>
        <Select
          className={styles.selectInput}
          value={component.variant}
          onChange={(event) => updateComponentProperty(event, "variant")}
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
          onChange={(event) => updateComponentProperty(event, "colour")}
        >
          <MenuItem value="white">White</MenuItem>
          <MenuItem value="teal">Teal</MenuItem>
        </Select>
      </FormControl>
      <FormControl fullWidth className={styles.componentProperty}>
        <CustomInputLabel shrink>Next Scene</CustomInputLabel>
        <Select
          className={styles.selectInput}
          value={component.nextScene}
          onChange={(event) => updateComponentProperty(event, "nextScene")}
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
    </>
  );
}
