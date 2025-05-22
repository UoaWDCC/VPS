import React from 'react'

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
  if (!currentScene || !currentScene.components) return;

  const zPositions = currentScene.components
    .map((c) => c.zPosition)
    .filter((z) => typeof z === "number");

  if (zPositions.length === 0 && (component?.zPosition ?? 0) === 0) {
    return;
  }

  const minZ = zPositions.length > 0 ? Math.min(...zPositions) : 0;

  if ((component?.zPosition ?? 0) === minZ) {
    if (zPositions.length > 0 || (component?.zPosition ?? 0) < 0) {
      return;
    }
  }
  if ((component?.zPosition ?? 0) < minZ) {
    return;
  }
  
  updateComponentProperty(component.id, "zPosition", minZ - 1);
    console.log("end");
};

/**
 * Brings a component to the front of the scene
 */
export const handleBringToFront = ({
  currentScene,
  component,
  componentIndex,
  updateComponentProperty,
}) => {
  if (!currentScene || !currentScene.components) return;

  const zPositions = currentScene.components
    .map((c) => c.zPosition)
    .filter((z) => typeof z === "number");

  const maxZ = zPositions.length > 0 ? Math.max(...zPositions) : 0;

  if ((component?.zPosition ?? 0) === maxZ) {
    if (zPositions.length > 0 || (component?.zPosition ?? 0) > 0) {
      return;
    }
  }
  if ((component?.zPosition ?? 0) > maxZ) {
    return;
  }
  updateComponentProperty(componentIndex, "zPosition", maxZ + 1);
};

/**
 * Moves a component one step backward in the Z-axis
 */
export const handleMoveBackward = ({
  component,
  componentIndex,
  updateComponentProperty,
}) => {
  updateComponentProperty(
    componentIndex,
    "zPosition",
    (component?.zPosition ?? 0) - 1
  );
};

/**
 * Moves a component one step forward in the Z-axis
 */
export const handleMoveForward = ({
  component,
  componentIndex,
  updateComponentProperty,
}) => {
  updateComponentProperty(
    componentIndex,
    "zPosition",
    (component?.zPosition ?? 0) + 1
  );
};

const ZAxis = () => {
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

export default ZAxis