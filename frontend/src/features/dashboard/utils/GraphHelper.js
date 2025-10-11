import { MarkerType } from "@xyflow/react";

const markerEnd = {
  type: MarkerType.ArrowClosed,
  wdith: 15,
  height: 15,
};

const CreateGraphData = (scenes, groupInfo) => {
  var sceneMap = [];
  var groupPath = [];
  const nodes = [];
  const edges = [];
  const groupEdges = [];
  const visitCounter = new Map();
  const edgeCounter = new Map();
  if (Array.isArray(scenes) && scenes.length != 0) {
    // Create a basic map of the scene ID and object
    sceneMap = Object.fromEntries(scenes.map((scene) => [scene._id, scene]));

    // Set and reverse group path then add it to the visited nodes
    if (Array.isArray(groupInfo.path)) {
      groupPath = groupInfo.path.reverse();
      groupPath.forEach((id) => {
        visitCounter.set(id, (visitCounter.get(id) || 0) + 1);
      });
    }
    // Loop through all nodes and create a nodes for ReactFlow
    scenes.forEach((scene) => {
      nodes.push({
        id: scene._id,
        type: "thumbnail",
        position: { x: 0, y: 0 },
        data: {
          label: scene.name,
          components: scene.components,
          visited: visitCounter.get(scene._id) != undefined,
          visitCounter: visitCounter.get(scene._id),
          isHighlighted: false,
        },
      });
    });

    // Loop through each component of a scene and check for the "nextScene" property and add it to edge graph
    scenes.forEach((scene) =>
      scene.components.forEach((obj) => {
        if (obj.nextScene) {
          edges.push({
            id: scene.name + "-" + sceneMap[obj.nextScene].name,
            source: scene._id,
            target: obj.nextScene,
            type: "simpleFloating",
            markerEnd: {
              ...markerEnd,
            },
            style: {
              strokeWidth: 3,
              stroke: "#b1b1b7",
            },
            animated: true,
          });
        }
      })
    );

    /**
     * Loop through group path to create the links of the students path
     * Also count the number of times the edges show up
     */
    for (let i = 0; i < groupPath.length - 1; i++) {
      const id =
        sceneMap[groupPath[i]].name + "-" + sceneMap[groupPath[i + 1]].name;
      edgeCounter.set(id, (edgeCounter.get(id) || 0) + 1);
      groupEdges.push({
        id: id,
        source: groupPath[i],
        target: groupPath[i + 1],
        type: "simpleFloating",
        markerEnd: {
          ...markerEnd,
          color: "#89d149",
        },
        style: {
          strokeWidth: 3,
          stroke: "#89d149",
          zIndex: 10000,
        },
        animated: true,
      });
    }
  }

  // Loop through and update the count of edge
  groupEdges.forEach((edge) => {
    edge.data = { label: edgeCounter.get(edge.id) };
  });
  return { nodes, edges, groupEdges, groupPath, sceneMap };
};

export default CreateGraphData;
