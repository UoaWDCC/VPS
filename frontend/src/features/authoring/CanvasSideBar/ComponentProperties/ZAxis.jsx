import React from "react";
import {
  Button,
  FormControl,
  MenuItem,
  Select,
  Typography,
} from "@material-ui/core";
import { useContext } from "react";
import SceneContext from "context/SceneContext";
import CustomInputLabelStyles from "../CustomPropertyInputStyles/CustomInputLabelStyles";
import styles from "../CanvasSideBar.module.scss";

const CustomInputLabel = CustomInputLabelStyles()(Typography);

/**
 * Utility functions for handling Z-axis positioning of components
 */

/**
 * Sends a component to the back of the scene
 */
export const handleSendToBack = ({
  currentScene,
  component,
  updateComponentProperty,
}) => {
  console.log("start");
  console.log("currentScene:", currentScene);
  console.log("component:", component);

  if (!currentScene || !currentScene.components) {
    console.log("early return: no scene or components");
    return;
  }

  console.log("all components:", currentScene.components);

  const zPositions = currentScene.components
    .filter((c) => c.id !== component.id) // Exclude current component
    .map((c) => {
      console.log("component z:", c.id, c.zPosition);
      return c.zPosition;
    })
    .filter((z) => typeof z === "number" && !isNaN(z));

  console.log("zPositions (excluding current):", zPositions);

  // If no other components have z-positions, set to 0
  if (zPositions.length === 0) {
    console.log("no other components with z-positions, setting to 0");
    updateComponentProperty(null, "zPosition", 0);
    return;
  }

  const minZ = Math.min(...zPositions);
  console.log("minZ from other components:", minZ);
  console.log("current component zPosition:", component?.zPosition ?? 0);

  // If current component is already at or below minZ, no need to change
  if ((component?.zPosition ?? 0) <= minZ) {
    console.log("component already at or below minZ, no change needed");
    return;
  }

  console.log("updating zPosition to:", minZ - 1);
  updateComponentProperty(null, "zPosition", minZ - 1);
  console.log("end");
};

/**
 * Brings a component to the front of the scene
 */
export const handleBringToFront = ({
  currentScene,
  component,
  updateComponentProperty,
}) => {
  if (!currentScene || !currentScene.components) return;

  const zPositions = currentScene.components
    .filter((c) => c.id !== component.id) // Exclude current component
    .map((c) => c.zPosition)
    .filter((z) => typeof z === "number" && !isNaN(z));

  // If no other components have z-positions, set to 0
  if (zPositions.length === 0) {
    updateComponentProperty(null, "zPosition", 0);
    return;
  }

  const maxZ = Math.max(...zPositions);

  // If current component is already at or above maxZ, no need to change
  if ((component?.zPosition ?? 0) >= maxZ) {
    return;
  }

  updateComponentProperty(null, "zPosition", maxZ + 1);
};

/**
 * Moves a component one step backward in the Z-axis
 */
export const handleMoveBackward = ({ component, updateComponentProperty }) => {
  const currentZ = component?.zPosition ?? 0;
  updateComponentProperty(null, "zPosition", currentZ - 1);
};

/**
 * Moves a component one step forward in the Z-axis
 */
export const handleMoveForward = ({ component, updateComponentProperty }) => {
  const currentZ = component?.zPosition ?? 0;
  updateComponentProperty(null, "zPosition", currentZ + 1);
};

const ZAxis = ({ component, componentIndex }) => {
  const { scenes, updateComponentProperty, currentScene } =
    useContext(SceneContext);

  return (
    <>
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
                updateComponentProperty: (_, property, value) =>
                  updateComponentProperty(componentIndex, property, value),
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
                updateComponentProperty: (_, property, value) =>
                  updateComponentProperty(componentIndex, property, value),
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
                updateComponentProperty: (_, property, value) =>
                  updateComponentProperty(componentIndex, property, value),
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
                updateComponentProperty: (_, property, value) =>
                  updateComponentProperty(componentIndex, property, value),
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
};

export default ZAxis;
