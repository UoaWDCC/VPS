import React, { useContext } from "react";
import {
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@material-ui/core";
import { withStyles } from "@material-ui/core/styles";
import SceneContext from "../../../../../context/SceneContext";

import styles from "../../../../../styling/CanvasSideBar.module.scss";

const CustomTextField = withStyles({
  root: {
    "& label.Mui-focused": {
      color: "#008a7b",
    },
    "& .MuiInput-underline:after": {
      borderBottomColor: "#008a7b",
    },
  },
})(TextField);

const CustomInputLabel = withStyles({
  root: {
    "&.Mui-focused": {
      color: "#008a7b",
    },
  },
})(InputLabel);

const CustomSelect = withStyles({
  root: {
    "& .MuiInput-underline.MuiInput-formControl:after": {
      borderBottomColor: "#008a7b",
    },
  },
})(Select);

export default function ButtonPropertiesComponent({
  component,
  componentIndex,
}) {
  const { scenes, currentScene, setCurrentScene } = useContext(SceneContext);

  return (
    <>
      <CustomTextField
        label="Text"
        value={component.text}
        fullWidth
        onChange={(event) => {
          const updatedComponents = currentScene.components;
          updatedComponents[componentIndex].text = event.target.value;

          setCurrentScene({
            ...currentScene,
            components: updatedComponents,
          });
        }}
        className={styles.componentProperty}
      />
      <FormControl fullWidth className={styles.componentProperty}>
        <CustomInputLabel shrink>Variant</CustomInputLabel>
        <CustomSelect
          className={styles.selectInput}
          value={component.variant}
          onChange={(event) => {
            const updatedComponents = currentScene.components;
            updatedComponents[componentIndex].variant = event.target.value;

            setCurrentScene({
              ...currentScene,
              components: updatedComponents,
            });
          }}
        >
          <MenuItem value="contained">Contained</MenuItem>
          <MenuItem value="outlined">Outlined</MenuItem>
        </CustomSelect>
      </FormControl>
      <FormControl fullWidth className={styles.componentProperty}>
        <CustomInputLabel shrink>Colour</CustomInputLabel>
        <CustomSelect
          className={styles.selectInput}
          value={component.colour}
          onChange={(event) => {
            const updatedComponents = currentScene.components;
            updatedComponents[componentIndex].colour = event.target.value;

            setCurrentScene({
              ...currentScene,
              components: updatedComponents,
            });
          }}
        >
          <MenuItem value="white">White</MenuItem>
          <MenuItem value="teal">Teal</MenuItem>
        </CustomSelect>
      </FormControl>
      <FormControl fullWidth className={styles.componentProperty}>
        <CustomInputLabel shrink>Next Scene</CustomInputLabel>
        <CustomSelect
          className={styles.selectInput}
          value={component.nextScene}
          onChange={(event) => {
            const updatedComponents = currentScene.components;
            updatedComponents[componentIndex].nextScene = event.target.value;

            setCurrentScene({
              ...currentScene,
              components: updatedComponents,
            });
          }}
          displayEmpty
        >
          <MenuItem value="">
            <em>None</em>
          </MenuItem>
          {scenes.map((scene) => {
            return <MenuItem value={scene.name}>{scene.name}</MenuItem>;
          })}
        </CustomSelect>
      </FormControl>
    </>
  );
}
