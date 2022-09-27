import React from "react";
import { Handle, Position } from "react-flow-renderer";
import { Box } from "@material-ui/core";
import Thumbnail from "../../../components/Thumbnail";

function SceneNode({ data }) {
  const { scenarioId, sceneId } = data;

  return (
    <Box>
      <Handle type="target" position={Position.Top} />
      <Thumbnail
        url={`${process.env.PUBLIC_URL}/play/${scenarioId}/${sceneId}`}
        width="160"
        height="90"
      />
      <Handle type="source" position={Position.Bottom} id="a" />
      {/* <h5 style={textStyle}>{sceneTitle}</h5> */}
    </Box>
  );
}

export default SceneNode;
