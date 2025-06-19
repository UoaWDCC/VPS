import { useEffect, useState } from "react";

export default function useScaledFontSize(
  baseFontSize,
  baseWidth = 1920,
  minFontSize = 8
) {
  const [scaledFontSize, setScaledFontSize] = useState(baseFontSize);

  useEffect(() => {
    function handleResize() {
      const scale = window.innerWidth / baseWidth;
      setScaledFontSize(
        Math.max(minFontSize, Math.round(baseFontSize * scale))
      );
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [baseFontSize, baseWidth, minFontSize]);

  return scaledFontSize;
}
