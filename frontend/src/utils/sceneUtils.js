/**
 * Utility functions for scene name management
 */


/**
 * Generates a unique scene name by checking existing scene names
 * @param {Array} scenes - Array of existing scenes
 * @param {String} baseName - Base name to use (default: "Scene")
 * @returns {String} - Unique scene name
 */
export function generateUniqueSceneName(scenes, baseName = "Scene"){

    // handle empty or non-eixting scenes array
    if (!scenes || scenes.length === 0) {
        return `${baseName} 1`;
    }
    
    // get all existing names, filtering out invalid scenes
    const existingNames = scenes
        .filter(scene => scene && scene.name && typeof scene.name === 'string')
        .map(scene => scene.name.toLowerCase().trim());


    let counter = 1;
    let newName = `${baseName} ${counter}`;
    
    // keep adding until we get a unique name
    while (existingNames.includes(newName.toLowerCase())) {
        counter++;
        newName = `${baseName} ${counter}`;
    }
    
    return newName;
}

/**
 * Checks if a scene name already exists (case-insensitive)
 * @param {String} name - Name to check
 * @param {Array} scenes - Array of existing scenes
 * @param {String} excludeId - Scene ID to exclude from check (for editing)
 * @returns {Boolean} - True if name already exists
 */
export function isSceneNameDuplicate(name, scenes, excludeId = null) {
    // handle empty or non-existing scenes array
    if (!scenes || scenes.length === 0) {
        console.log("Invalid scenes or name provided for duplicate checking");
        return false;
    }

    // normalise the name to check
    const normalisedName = name ? name.toLowerCase().trim() : '';

    for (const scene of scenes) {
        // skip the scene if its ID matches the excludeId
        if (scene._id === excludeId) {
            continue;
        }

        // check if the scene name matches the normalised name
        if (scene.name && scene.name.toLowerCase().trim() === normalisedName) {
            return true;
        }
    }

    return false;
}

/**
 * Generates a unique name for a duplicated scene
 * @param {String} originalName - Original scene name
 * @param {Array} scenes - Array of existing scenes
 * @returns {String} - Unique name for the duplicate
 */
export function generateDuplicateSceneName(originalName, scenes) {
    // Validate original name
    if (!originalName || typeof originalName !== 'string') {
        return 'Untitled Copy';
    }
    
    // Handle empty scenes array
    if (!scenes || scenes.length === 0) {
        return `${originalName} Copy`;
    }
    
 
    const existingNames = scenes
        .filter(scene => scene && scene.name && typeof scene.name === 'string')
        .map(scene => scene.name.toLowerCase().trim());
    
    let counter = 1;
    let newName = `${originalName} Copy`;
    
    // if copy is taken add numberss
    while (existingNames.includes(newName.toLowerCase())) {
        counter++;
        newName = `${originalName} Copy ${counter}`;
    }
    
    return newName;
}



