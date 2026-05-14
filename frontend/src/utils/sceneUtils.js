/**
 * Utility functions for scene name management
 */

/**
 * Generates a unique scene name by checking existing scene names
 * @param {Array} scenes - Array of existing scenes
 * @param {String} baseName - Base name to use (default: "Scene")
 * @returns {String} - Unique scene name
 */
export function generateUniqueSceneName(
  scenes,
  baseName = "Scene",
  excludeId = null
) {
  // handle empty or non-existing scenes array
  if (!scenes || scenes.length === 0) {
    return baseName;
  }

  // get all existing names, filtering out invalid scenes and the excluded ID
  const existingNames = scenes
    .filter(
      (scene) =>
        scene &&
        scene.name &&
        typeof scene.name === "string" &&
        scene._id !== excludeId
    )
    .map((scene) => scene.name.toLowerCase().trim());

  // Check if baseName already ends with a number
  const match = baseName.match(/^(.*?)(\s*\d+)?$/);
  const namePrefix = match[1].trim() || "Scene";
  let counter = match[2] ? parseInt(match[2].trim(), 10) : 1;

  let newName = baseName;

  // keep adding until we get a unique name
  while (existingNames.includes(newName.toLowerCase())) {
    counter++;
    newName = `${namePrefix} ${counter}`;
  }

  return newName;
}

/**
 * Generates a unique name for a duplicated scene
 * @param {String} originalName - Original scene name
 * @param {Array} scenes - Array of existing scenes
 * @returns {String} - Unique name for the duplicate
 */
export function generateDuplicateSceneName(originalName, scenes) {
  // Validate original name
  if (!originalName || typeof originalName !== "string") {
    return "Untitled Copy";
  }

  // Handle empty scenes array
  if (!scenes || scenes.length === 0) {
    return `${originalName} Copy`;
  }

  const existingNames = scenes
    .filter((scene) => scene && scene.name && typeof scene.name === "string")
    .map((scene) => scene.name.toLowerCase().trim());

  let counter = 1;
  let newName = `${originalName} Copy`;

  // if copy is taken add numberss
  while (existingNames.includes(newName.toLowerCase())) {
    counter++;
    newName = `${originalName} Copy ${counter}`;
  }

  return newName;
}
