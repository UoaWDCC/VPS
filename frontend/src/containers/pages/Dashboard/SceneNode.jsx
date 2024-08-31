import { Box } from "@material-ui/core";
import { Handle, Position } from "react-flow-renderer";

function SceneNode() {
  // const { scenarioId, sceneId } = data;

  return (
    <Box>
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} id="a" />
      {/* <h5 style={textStyle}>{sceneTitle}</h5> */}
    </Box>
  );
}

export default SceneNode;
