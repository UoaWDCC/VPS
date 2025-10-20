import ResizeHandle from "./ConstrainedHandle";
import DragHandles from "./DragHandles";

function SpeechHandles() {
  return (
    <>
      <DragHandles />
      <ResizeHandle x={2} y={2} />
    </>
  );
}

export default SpeechHandles;
