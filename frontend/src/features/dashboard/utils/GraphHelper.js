import { MarkerType } from "@xyflow/react";
import { describeCondition } from "../../playScenario/debug/describe.js";

const markerEnd = {
  type: MarkerType.ArrowClosed,
  wdith: 15,
  height: 15,
};

const CreateGraphData = (scenes, groupInfo, properties = []) => {
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
          background: scene.background,
          visited: visitCounter.get(scene._id) != undefined,
          visitCounter: visitCounter.get(scene._id),
          isHighlighted: false,
        },
      });
    });

    // Loop through each component of a scene and add an edge for each scene it
    // can lead to: its "nextScene", and the scene of each of its destination
    // rules. A button with rules labels each edge with the condition for it,
    // so the graph shows what a branch depends on. Buttons leading the same
    // way share one edge, and its labels are all of theirs, unless one of them
    // always leads there, when no condition applies.
    const authored = new Map();
    const unconditional = new Set();
    const addEdge = (scene, targetId, branch) => {
      const target = sceneMap[targetId];
      if (!target) return;

      const id = scene.name + "-" + target.name;
      if (!branch) unconditional.add(id);
      const existing = authored.get(id);
      if (existing) {
        if (branch && !existing.data.branches.includes(branch))
          existing.data.branches.push(branch);
        return;
      }

      authored.set(id, {
        id,
        source: scene._id,
        target: targetId,
        type: "simpleFloating",
        markerEnd: {
          ...markerEnd,
          color: "var(--color-primary)",
        },
        style: {
          strokeWidth: 3,
          stroke: "var(--color-primary)",
        },
        animated: true,
        data: { branches: branch ? [branch] : [] },
      });
    };

    scenes.forEach((scene) =>
      scene.components.forEach((obj) => {
        const rules = obj.nextSceneRules ?? [];
        rules.forEach((rule) =>
          addEdge(scene, rule.sceneId, describeCondition(rule, properties))
        );
        addEdge(scene, obj.nextScene, rules.length ? "otherwise" : null);
      })
    );
    unconditional.forEach((id) => {
      authored.get(id).data.branches = [];
    });
    edges.push(...authored.values());

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
          color: "var(--color-success)",
        },
        style: {
          strokeWidth: 3,
          stroke: "var(--color-success)",
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
