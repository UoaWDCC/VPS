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
  if (!currentScene || !currentScene.components) {
    return;
  }

  const zPositions = currentScene.components
    .filter((c) => c.id !== component.id) // Exclude current component
    .map((c) => {
      return c.zPosition;
    })
    .filter((z) => typeof z === "number" && !isNaN(z));

  // If no other components have z-positions, set to 0
  if (zPositions.length === 0) {
    updateComponentProperty(null, "zPosition", 0);
    return;
  }

  const minZ = Math.min(...zPositions);

  // If current component is already at or below minZ, no need to change
  if ((component?.zPosition ?? 0) < minZ) {
    return;
  }

  updateComponentProperty(null, "zPosition", minZ - 1);
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
  if ((component?.zPosition ?? 0) > maxZ) {
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
