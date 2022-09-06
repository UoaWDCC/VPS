export default class Graph {
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
      if (
        scene.components.filter(
          (it) => it.type === "BUTTON" && it.nextScene !== ""
        ).length === 0
      ) {
        this.endScenes.push(scene._id);
      }
    });

    // Fill dist matrix with Inifinity
    for (let i = 0; i < scenes.length; i += 1) {
      dist.push(new Array(scenes.length).fill(Infinity));
    }

    // Update dist matrix to represent current graph
    scenes.forEach((scene) => {
      // Distance 0 from itself
      dist[this.rule[scene._id]][this.rule[scene._id]] = 0;

      scene.components.forEach((component) => {
        if (component.type === "BUTTON" && component.nextScene !== "") {
          // this is the weight of the edge, can adjust later for scoring feature
          dist[this.rule[scene._id]][this.rule[component.nextScene]] = 1;
        }
      });
    });

    // Run Floyd's algorithm to compute all pairs shortest path.
    for (let k = 0; k < scenes.length; k += 1) {
      for (let i = 0; i < scenes.length; i += 1) {
        for (let j = 0; j < scenes.length; j += 1) {
          if (dist[i][k] + dist[k][j] < dist[i][j]) {
            dist[i][j] = dist[i][k] + dist[k][j];
          }
        }
      }
    }

    this.dist = dist;
  }

  distanceFrom(startScene, endScene) {
    return this.dist[this.rule[startScene]][this.rule[endScene]];
  }

  progress(currentScene) {
    return this.endScenes
      .filter(
        (endScene) => this.distanceFrom(currentScene, endScene) !== Infinity
      )
      .map(
        (endScene) =>
          this.distanceFrom(this.root, currentScene) /
          (this.distanceFrom(this.root, currentScene) +
            this.distanceFrom(currentScene, endScene))
      )
      .reduce((prev, curr) => (prev < curr ? prev : curr));
  }
}
