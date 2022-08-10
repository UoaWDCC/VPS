/**
 * Creates a graph representation of a list of scenes.
 * @param scene - An array of scene objects
 */
export default class ScenarioGraph {

    // Store graph as a modified adjacency list for easy indexing
    graph = {};

    constructor(scenes) {

        // Iterate over each scene
        scenes.forEach((scene) => {

            let children = [];
            let leaf = true;

            // Iterate over each component of a scene
            scene.components.forEach((component) => {
                
                // Check if the scene has any links to other scenes
                if (component.type === 'BUTTON') {
                    children.push(component.nextScene);
                    leaf = false;    // Scene is not a leaf as it has a child.
                }
            })

            // Add node to graph
            this.graph[scene._id] = {
                endScene: leaf,
                linkedScenes: children
            }
        })
    }

    // Getters
    get graph() { return this.graph }
    
}
