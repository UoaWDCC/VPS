import ResizeHandle from "./ConstrainedHandle";

function LineHandles() {
  return (
    <>
      <ResizeHandle x={0} y={0} />
      <ResizeHandle x={1} y={1} />
    </>
  );
};

export default LineHandles;
