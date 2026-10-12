// The colours used by the library's preset buttons and icons.
//
// Presets end up inside scenes, which store colours as plain hex values and
// can't refer to CSS variables, so the theme's colours are written out here.
// PALETTE_SOURCES says which theme token in index.css each one mirrors, and
// palette.test.js fails if they ever drift apart. The generator script that
// draws the preset images reads this same palette.

export const PALETTE = {
  accent: "#0080a7",
  success: "#367a2f",
  warning: "#8a5f16",
  error: "#c13216",
  info: "#316b8a",
  neutral: "#45454b",
  // text on the page, and the colour of text sitting on a solid fill
  content: "#252529",
  onSolid: "#f4f4f1",
  // light surfaces
  light: "#e6e6e6",
  white: "#ffffff",
};

/** The index.css custom property each palette colour is taken from. */
export const PALETTE_SOURCES = {
  accent: "--color-accent",
  success: "--color-success",
  warning: "--color-light-warning",
  error: "--color-error",
  info: "--color-light-info",
  neutral: "--color-light-neutral",
  content: "--color-light-content",
  onSolid: "--color-light-on-solid",
  light: "--color-light-base",
  white: "--color-white",
};
