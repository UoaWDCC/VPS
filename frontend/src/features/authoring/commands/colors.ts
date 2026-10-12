import { PALETTE } from "../library/palette.js";
import { CommandError } from "./types";

// Colours as the editor stores them: 8 digit hex, like #0080a7ff. The model
// can say it however is natural: a hex code, a basic colour name, or one of
// the app's own theme colours ("accent", "success"...), which keeps what it
// builds in line with the rest of the product.

const NAMED: Record<string, string> = {
  black: "#000000",
  white: "#ffffff",
  red: "#e53935",
  orange: "#fb8c00",
  yellow: "#fdd835",
  green: "#43a047",
  teal: "#00897b",
  blue: "#1e88e5",
  purple: "#8e24aa",
  pink: "#ec407a",
  brown: "#6d4c41",
  grey: "#9e9e9e",
  gray: "#9e9e9e",
  // the app's theme colours
  accent: PALETTE.accent,
  success: PALETTE.success,
  warning: PALETTE.warning,
  error: PALETTE.error,
  danger: PALETTE.error,
  info: PALETTE.info,
  neutral: PALETTE.neutral,
  content: PALETTE.content,
};

export const COLOR_HELP =
  "a hex code such as #0080a7, 'transparent', or a name: " +
  Object.keys(NAMED).join(", ");

/**
 * Turns what the model wrote into the editor's 8 digit hex form.
 * @throws CommandError saying what's accepted
 */
export function parseColor(input: string): string {
  const text = input.trim().toLowerCase();

  if (text === "transparent" || text === "none") return "#00000000";
  if (NAMED[text]) return `${NAMED[text]}ff`;

  const hex = /^#?([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/.exec(text);
  if (hex) {
    let digits = hex[1];
    if (digits.length <= 4)
      digits = digits
        .split("")
        .map((d) => d + d)
        .join("");
    return `#${digits.length === 6 ? `${digits}ff` : digits}`;
  }

  throw new CommandError(
    `"${input}" isn't a colour I know. Use ${COLOR_HELP}.`
  );
}

function channels(hex: string) {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
}

function luminance(hex: string) {
  const [r, g, b] = channels(hex).map((c) =>
    c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string) {
  const [lighter, darker] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Text colour that reads on a given fill: the theme's light "on solid" colour
 * or its dark content colour, whichever contrasts more. A transparent fill
 * sits on the white canvas.
 */
export function readableTextColor(fill?: string) {
  const opaque = fill && !fill.endsWith("00") ? fill.slice(0, 7) : "#ffffff";
  return contrastRatio(PALETTE.onSolid, opaque) >=
    contrastRatio(PALETTE.content, opaque)
    ? PALETTE.onSolid
    : PALETTE.content;
}
