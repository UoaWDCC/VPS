import React, { useCallback } from "react";
import { Handle, Position } from "react-flow-renderer";
import Thumbnail from "../../../components/Thumbnail";

const handleStyle = { left: 10 };

function SceneNode({ data }) {
  const { scenarioId, sceneId, sceneTitle } = data;
  console.log(scenarioId, sceneId, sceneTitle);
  return (
    <>
      <Handle type="target" position={Position.Top} />
      <Thumbnail
        url={`${process.env.PUBLIC_URL}/play/${scenarioId}/${sceneId}`}
        width="160"
        height="90"
      />
      <Handle type="source" position={Position.Bottom} id="a" />
      <h2 style={{ textAlign: "center" }}>{sceneTitle}</h2>
    </>
  );
}

export default SceneNode;
