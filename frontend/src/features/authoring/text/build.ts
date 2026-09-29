import type {
  BaseTextStyle,
  ModelBlock,
  ModelDocument,
  ModelSpan,
} from "../types";
import type { VisualBlock, VisualDocument, VisualLine } from "./types";
import { CHIP_X_PADDING } from "./property";

const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

const fallback: BaseTextStyle = {
  alignment: "center",
  lineHeight: 1.1,
  fontFamily: "Arial",
  fontSize: 24,
  fontWeight: "normal",
  fontStyle: "normal",
  textDecoration: "none",
  textColor: "#000000",
  highlightColor: "#00000000",
};

function measure(text: string) {
  return ctx.measureText(text);
}

function buildFont(styles: Partial<BaseTextStyle>) {
  const { fontFamily, fontSize, fontWeight, fontStyle, lineHeight } = styles;
  return `${fontStyle} ${fontWeight} ${fontSize}px/${lineHeight! * fontSize!}px "${fontFamily}"`;
}

function setFont(style?: Partial<BaseTextStyle>) {
  if (!style?.fontFamily || !style?.fontSize) return;
  ctx.font = buildFont(style);
}

export function squash(
  base?: Partial<BaseTextStyle>,
  block?: Partial<BaseTextStyle>,
  span?: Partial<BaseTextStyle>
): BaseTextStyle {
  return { ...fallback, ...base, ...block, ...span };
}

export function buildStyle(derived: Partial<BaseTextStyle>) {
  return {
    font: buildFont(derived),
    fill: derived.textColor,
    textDecoration: derived.textDecoration,
  };
}

function generateOffsets(text: string, style: BaseTextStyle) {
  setFont(style);
  const offsets = [];
  for (let i = 0; i <= text.length; i++) {
    offsets.push(measure(text.slice(0, i)).width);
  }
  return offsets;
}

function generateLineOffset(
  alignment: string,
  width: number,
  lineWidth: number
) {
  if (!alignment || alignment === "left") return 0;
  const remaining = width - lineWidth;
  if (alignment === "center") return remaining / 2;
  return remaining;
}

function createNewLine(props?: Partial<VisualLine>): VisualLine {
  return {
    spans: [],
    y: 0,
    x: 0,
    width: 0,
    height: 0,
    baseline: 0,
    maxFontSize: 0,
    maxDescent: 0,
    ...props,
  };
}

interface SpanRef {
  span: ModelSpan;
  text: string;
  index: number;
  start: number;
}

function buildVisualLines(
  spans: ModelSpan[],
  maxWidth: number,
  blockStyle: BaseTextStyle
) {
  const lines: VisualLine[] = [];
  const { alignment, lineHeight } = blockStyle;
  let currentLine = createNewLine();

  let wordBuffer: SpanRef[] = [];

  function endLine() {
    currentLine.x = generateLineOffset(alignment, maxWidth, currentLine.width);
    currentLine.height = lineHeight * currentLine.maxFontSize;
    currentLine.baseline = currentLine.height - currentLine.maxDescent;
    lines.push(currentLine);
  }

  function wrapLine() {
    endLine();
    currentLine = createNewLine({ y: currentLine.y + currentLine.height });
  }

  function pushSpan(
    ref: SpanRef,
    style: BaseTextStyle,
    text: string,
    startIndex: number,
    width: number,
    charOffsets: number[]
  ) {
    currentLine.spans.push({
      text,
      charOffsets,
      style,
      width,
      x: currentLine.width,
      parentId: ref.index,
      startIndex,
      property: ref.span.property,
    });
    currentLine.width += width;

    setFont(style);
    const descent = measure("Mg").actualBoundingBoxDescent;
    if (descent > currentLine.maxDescent) currentLine.maxDescent = descent;
    if (style.fontSize > currentLine.maxFontSize)
      currentLine.maxFontSize = style.fontSize;
  }

  // a word too wide for the box has no wrap point, so break between characters
  function pushBrokenSpan(
    ref: SpanRef,
    style: BaseTextStyle,
    offsets: number[]
  ) {
    let start = 0;

    while (start < ref.text.length) {
      const base = offsets[start];

      let end = start;
      while (
        end < ref.text.length &&
        currentLine.width + offsets[end + 1] - base <= maxWidth
      )
        end++;

      if (end === start) {
        // retry on an empty line; if not even one char fits, take it anyway
        if (currentLine.width > 0) {
          wrapLine();
          continue;
        }
        end = start + 1;
      }

      pushSpan(
        ref,
        style,
        ref.text.slice(start, end),
        ref.start + start,
        offsets[end] - base,
        offsets.slice(start, end + 1).map((offset) => offset - base)
      );

      start = end;
      if (start < ref.text.length) wrapLine();
    }
  }

  function flushWordBuffer() {
    if (wordBuffer.length === 0) return;

    const measuredParts = wordBuffer.map((ref) => {
      const style = squash(blockStyle, ref.span.style);
      setFont(style);

      //property chips measure width from name+padding instead of unicode char
      //offsets have only two cursor positions (front and back)
      if (ref.span.property) {
        const width =
          measure(ref.span.property.displayName).width + CHIP_X_PADDING * 2;
        return { ref, style, width, offsets: [0, width] };
      }

      return {
        ref,
        style,
        width: measure(ref.text).width,
        offsets: generateOffsets(ref.text, style),
      };
    });
    const wordWidth = measuredParts.reduce((sum, p) => sum + p.width, 0);

    // a word that fits on a line of its own moves down whole, and is only broken
    // up if it overflows even then
    if (currentLine.width + wordWidth > maxWidth && currentLine.width > 0) {
      wrapLine();
    }

    for (const part of measuredParts) {
      const { ref, style, width, offsets } = part;

      // chips are atomic; a box narrower than its padding has nothing to break against
      const breakable =
        !ref.span.property && ref.text.length > 0 && maxWidth > 0;

      if (breakable && currentLine.width + width > maxWidth) {
        pushBrokenSpan(ref, style, offsets);
        continue;
      }

      // an atomic part that doesn't fit drops to the next line instead of
      // running past the edge, so the box gains a line rather than overflowing
      if (currentLine.width > 0 && currentLine.width + width > maxWidth)
        wrapLine();

      pushSpan(ref, style, ref.text, ref.start, width, offsets);
    }

    wordBuffer = [];
  }

  for (let j = 0; j < spans.length; j++) {
    const span = spans[j];

    //property chip cannot be split between lines
    if (span.property) {
      wordBuffer.push({ span, text: span.text, index: j, start: 0 });
      continue;
    }
    const tokens = span.text.split(/(\s+)/);

    let offset = 0;
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      if (token === "") continue;

      if (/\s/.test(token)) {
        flushWordBuffer();

        const style = squash(blockStyle, span.style);
        setFont(style);
        const spaceWidth = measure(token).width;
        pushSpan(
          { span, text: token, index: j, start: offset },
          style,
          token,
          offset,
          spaceWidth,
          generateOffsets(token, style)
        );
      } else {
        wordBuffer.push({ span, text: token, index: j, start: offset });
      }
      offset += token.length;
    }
  }

  if (spans.length === 1 && spans[0].text.length === 0)
    wordBuffer.push({ span: spans[0], text: "", index: 0, start: 0 });

  flushWordBuffer();

  if (currentLine.spans.length > 0) endLine();

  return lines;
}

function buildBlock(
  block: ModelBlock,
  offset: number,
  maxWidth: number,
  blockStyle: BaseTextStyle
) {
  const visualBlock: VisualBlock = {
    lines: [],
    y: offset,
    style: blockStyle,
    height: 0,
  };

  const lines = buildVisualLines(block.spans, maxWidth, blockStyle);

  if (lines.length > 0) {
    const { y, height } = lines[lines.length - 1];
    visualBlock.height = y + height;
  }
  visualBlock.lines = lines;

  return visualBlock;
}

export function buildVisualDocument(doc: ModelDocument): VisualDocument {
  const { blocks, bounds, style } = doc;
  const visualBlocks: VisualBlock[] = [];

  let offset = 0;
  for (let i = 0; i < blocks.length; i++) {
    const squashed = squash(style, blocks[i].style);
    const visual = buildBlock(blocks[i], offset, bounds.width, squashed);
    offset += visual.height;
    visualBlocks.push(visual);
  }

  return { ...doc, blocks: visualBlocks };
}
