import React from "react";
import { Handle, Position } from "react-flow-renderer";
import { Box } from "@material-ui/core";
import Thumbnail from "../../../components/Thumbnail";

const boxStyle = {
  backgroundColor: "#008A7B",
  borderRadius: "5px",
  padding: "1rem",
  border: "3px solid black",
};
const textStyle = {
  fontWeight: "normal",
  border: "3px solid red",
  margin: "0",
  padding: "0",
};

function SceneNode({ data }) {
  const { scenarioId, sceneId, sceneTitle } = data;
  console.log(scenarioId, sceneId, sceneTitle);

  return (
    <Box sx={boxStyle}>
      <Handle type="target" position={Position.Top} />
      <Thumbnail
        url={`${process.env.PUBLIC_URL}/play/${scenarioId}/${sceneId}`}
        width="160"
        height="90"
      />
      <Handle type="source" position={Position.Bottom} id="a" />
      <h5 style={textStyle}>{sceneTitle}</h5>
    </Box>
  );
}

export default SceneNode;
