export const ensureRgbObject = (colour) => {
  if (!colour) return { r: 0, g: 0, b: 0, a: 1 };

  if (typeof colour === "object") return colour;

  const match = colour
    .replace(/[^\d,]/g, "")
    .split(",")
    .map(Number);

  return { r: match[0], g: match[1], b: match[2], a: match[3] ?? 1 };
};

export const toRgbaString = (colour) => {
  if (!colour) return "rgba(0, 0, 0, 1)";

  if (typeof colour === "object") {
    const { r, g, b, a = 1 } = colour;
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }

  return colour;
};
