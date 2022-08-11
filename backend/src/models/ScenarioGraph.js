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
                name: scene.name,
                endScene: leaf,
                linkedScenes: children
            }
        })
    }

    // Getters

    get graph() { return this.graph }

    // Methods

    /**
     * Computes the distance between two scenes.
     * @param startScene: string - the id of the starting scene
     * @param endScene: string - the id of the end scene
     * @returns depth: number - the distance from the startScene to the endScene.
     *                          If endScene does not exist within the graph or 
     *                          there is not directed path from startScene to
     *                          endScene, return -1.
     */
    distanceBetween(startScene, endScene) {

        if (startScene === endScene) {
            return 0;
        }

        let depth = 0;
        let queue = new Queue();
        let seen = [];
        let found = false;

        queue.enqueue(startScene);

        // Apply BFS
        while (!(queue.isEmpty || found)) {

            // Variable to count the number of scenes on this level
            let levelSize = queue.length;

            while (levelSize > 0) {

                let scene = queue.dequeue();
                this.graph[scene].linkedScenes.forEach((linkedScene) => {

                    // Check if we have found the endScene
                    if (linkedScene === endScene) {
                        found = true;
                    }

                    // If we have not seen this scene before, enqueue and add 
                    // to seen array
                    if (!seen.includes(linkedScene)) {
                        queue.enqueue(linkedScene);
                        seen.push(linkedScene);
                    }

                })
                levelSize--;
            }
            depth++;
        }
        return found ? depth : -1;
    }
    
}

/**
 * Queue data structure for graph algorithms
 */
export class Queue {

    queue = [];

    constructor() {}

    // Getters

    get length() { return this.queue.length }

    get isEmpty() { return this.queue.length === 0 ? true : false}

    get queue() { return this.queue }

    // Methods 

    enqueue(item) { this.queue.push(item) }

    dequeue() { return this.queue.shift() }

    peek() { return this.queue.length > 1 ? this.queue[0] : null }

}
