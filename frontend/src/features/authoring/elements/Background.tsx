import { CANVAS_HEIGHT, CANVAS_WIDTH } from "../../../util/canvas";
import type { SceneBackground } from "../types";

const preserveAspectRatioByFit = {
  cover: "xMidYMid slice",
  contain: "xMidYMid meet",
  fill: "none",
} as const;

function Background({ background }: { background: SceneBackground | null }) {
  if (!background) return null;

  if (background.kind === "color") {
    return (
      <rect
        x="0"
        y="0"
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        fill={background.color}
        pointerEvents="none"
      />
    );
  }

  return (
    <image
      x="0"
      y="0"
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      href={background.href}
      preserveAspectRatio={
        preserveAspectRatioByFit[background.fit] ??
        preserveAspectRatioByFit.cover
      }
      pointerEvents="none"
    />
  );
}

export default Background;
