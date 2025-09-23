import RotationHandle from "./RotationHandle";
import ResizeHandle from "./ConstrainedHandle";

function DragHandles() {
  return (
    <>
      <ResizeHandle x={0} y={0} />
      <ResizeHandle x={1} y={0} />
      <ResizeHandle x={1} y={1} />
      <ResizeHandle x={0} y={1} />
      <ResizeHandle x={0.5} y={0} />
      <ResizeHandle x={0.5} y={1} />
      <ResizeHandle x={0} y={0.5} />
      <ResizeHandle x={1} y={0.5} />
      <RotationHandle />
    </>
  );
};

export default DragHandles;
