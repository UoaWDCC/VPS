/**
 * Utility functions for handling Z-axis positioning of components
 */

/**
 * Sends a component to the back of the scene
 */
export const handleSendToBack = ({
  currentScene,
  component,
  componentIndex,
  updateComponentProperty,
}) => {
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
  updateComponentProperty(componentIndex, "zPosition", minZ - 1);
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
