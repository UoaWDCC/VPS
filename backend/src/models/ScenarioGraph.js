export default class ScenarioGraph {

    /**
     * The rule variable maps an id to an index.
     * 
     * rule = {
     *  ...
     *  "6295a71dc02aa66b701339b2": 4,
     *  ...
     * }
     * 
     * There is probably a better data structure to represent
     * the dist component when just using scene ids to index.
     */
    rule = {};
    endScenes = [];
    root;
    dist;

    constructor(root, scenes) {

        this.root = root;
        const dist = [];

        scenes.forEach((scene, index) => {

            // Generate rule map
            this.rule[scene._id] = index;

            // Determine end scenes and store them for later
            if (scene.components.filter((it) => it.type === 'BUTTON' && it.nextScene !== "").length === 0) {
                this.endScenes.push(scene._id);
            }
        })

        // Fill dist matrix with Inifinity
        for (let i = 0; i < scenes.length; i++) {
            dist.push(new Array(scenes.length).fill(Infinity));
        }

        // Update dist matrix to represent current graph
        scenes.forEach((scene) => {

            // Distance 0 from itself
            dist[this.rule[scene._id]][this.rule[scene._id]] = 0;

            scene.components.forEach((component) => {
                if (component.type === 'BUTTON' && component.nextScene !== "") {

                    // this is the weight of the edge, can adjust later for scoring feature
                    dist[this.rule[scene._id]][this.rule[component.nextScene]] = 1 
                }
            })
        })

        // Run Floyd's algorithm to compute all pairs shortest path.
        for (let k = 0; k < scenes.length; k++) {
            for (let i = 0; i < scenes.length; i++) {
                for (let j = 0; j < scenes.length; j++) {
                    if (dist[i][k] + dist[k][j] < dist[i][j]) {
                        dist[i][j] = dist[i][k] + dist[k][j];
                    }
                }
            }
        }

        this.dist = dist;
    }

    /**
     * 
     * @param {*} startScene: string - the starting scene id. 
     * @param {*} endScene : string - the ending scene id.
     * @returns : number - distance from start scene to end scene.
     */
    distanceFrom(startScene, endScene) {
        return this.dist[this.rule[startScene]][this.rule[endScene]];
    }

    /**
     * 
     * @param {*} currentScene: string - the current scene id.
     * @returns : number - returns number between 0 to 1 that represents the progress
     *                     from the root to the furthest end scene.
     */
    progress(currentScene) {
        return this.endScenes
                .filter((endScene) => this.distanceFrom(currentScene, endScene) !== Infinity)                    
                .map((endScene) => this.distanceFrom(this.root, currentScene) / (this.distanceFrom(this.root, currentScene) + this.distanceFrom(currentScene, endScene)))    
                .reduce((prev, curr) => prev < curr ? prev : curr)                                              
    }
    
}
