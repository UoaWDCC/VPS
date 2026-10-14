import type { Scene } from "../types";

export const fontFamilies = [
  "DM Sans",
  "IBM Plex Sans",
  "Mona Sans",
  "Inter",
  "Open Sans",
  "Roboto",
  "Lato",
  "Montserrat",
  "Poppins",
  "Source Sans 3",
  "Work Sans",
  "Fira Sans",
  "Space Grotesk",
  "Bebas Neue",
  "Oswald",
  "Playfair Display",
  "Merriweather",
  "Lora",
  "Libre Baskerville",
  "Cormorant Garamond",
  "Bitter",
  "Roboto Mono",
  "Arial",
  "Verdana",
  "Tahoma",
  "Trebuchet MS",
  "Times New Roman",
  "Georgia",
  "Garamond",
  "Courier New",
  "Helvetica",
];

const googleFontFamilies = new Set(fontFamilies.slice(3, 22));
const fontLoads = new Map<string, Promise<void>>();

export function findFont(fontName: string) {
  const normalizedFontName = fontName.trim().toLowerCase();
  return fontFamilies.find((font) => font.toLowerCase() === normalizedFontName);
}

export function findFonts(search = "") {
  const normalizedSearch = search.trim().toLowerCase();

  return normalizedSearch
    ? fontFamilies.filter((font) =>
        font.toLowerCase().includes(normalizedSearch)
      )
    : fontFamilies;
}

export function isGoogleFont(fontFamily: string) {
  return googleFontFamilies.has(fontFamily);
}

export function getSceneGoogleFonts(scene: Scene) {
  const usedFonts = new Set<string>();

  for (const component of Object.values(scene.components)) {
    if (component.type !== "textbox") continue;

    for (const block of component.document.blocks) {
      for (const span of block.spans) {
        const fontFamily =
          span.style?.fontFamily ?? component.document.style?.fontFamily;
        if (fontFamily && isGoogleFont(fontFamily)) {
          usedFonts.add(fontFamily);
        }
      }
    }
  }

  return [...usedFonts];
}

export function loadFont(fontFamily: string) {
  if (!isGoogleFont(fontFamily) || typeof document === "undefined") {
    return Promise.resolve();
  }

  const existingLoad = fontLoads.get(fontFamily);
  if (existingLoad) return existingLoad;

  const fontLoad = new Promise<void>((resolve) => {
    const stylesheet = document.createElement("link");
    const encodedFontFamily = encodeURIComponent(fontFamily).replace(
      /%20/g,
      "+"
    );

    stylesheet.rel = "stylesheet";
    stylesheet.href = `https://fonts.googleapis.com/css2?family=${encodedFontFamily}&display=swap`;
    stylesheet.onload = () => {
      document.fonts
        .load(`16px "${fontFamily}"`)
        .catch(() => undefined)
        .finally(resolve);
    };
    stylesheet.onerror = () => resolve();
    document.head.append(stylesheet);
  });

  fontLoads.set(fontFamily, fontLoad);
  return fontLoad;
}
