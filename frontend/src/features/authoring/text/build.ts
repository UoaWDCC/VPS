import type { BaseTextStyle, ModelBlock, ModelDocument, ModelSpan } from "../types";
import type { VisualBlock, VisualDocument, VisualLine } from "./types";

const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

const fallback: BaseTextStyle = {
    alignment: "center",
    lineHeight: 1.1,
    fontFamily: "Arial",
    fontSize: 16,
    fontWeight: "normal",
    fontStyle: "normal",
    textDecoration: "none",
    textColor: "#000000",
    highlightColor: "#000000",
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
    span?: Partial<BaseTextStyle>,
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

function generateLineOffset(alignment: string, width: number, lineWidth: number) {
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
        ...props
    };
}

interface SpanRef {
    span: ModelSpan;
    text: string;
    index: number;
    start: number;
}

function buildVisualLines(spans: ModelSpan[], maxWidth: number, blockStyle: BaseTextStyle) {
    const lines: VisualLine[] = [];
    const { alignment, lineHeight } = blockStyle;
    let currentLine = createNewLine();

    let wordBuffer: SpanRef[] = [];

    function flushWordBuffer() {
        if (wordBuffer.length === 0) return;

        const measuredParts = wordBuffer.map(ref => {
            const style = squash(blockStyle, ref.span.style);
            setFont(style);
            const metrics = measure(ref.text);
            return { ref, style, metrics };
        });
        const wordWidth = measuredParts.reduce((sum, p) => sum + p.metrics.width, 0);

        if (currentLine.width + wordWidth > maxWidth && currentLine.width > 0) {
            currentLine.x = generateLineOffset(alignment, maxWidth, currentLine.width);
            currentLine.height = lineHeight * currentLine.maxFontSize;
            currentLine.baseline = currentLine.height - currentLine.maxDescent;
            lines.push(currentLine);

            currentLine = createNewLine({ y: currentLine.y + currentLine.height });
        }

        for (const part of measuredParts) {
            const { ref, style, metrics } = part;
            currentLine.spans.push({
                text: ref.text,
                charOffsets: generateOffsets(ref.text, style),
                style,
                width: metrics.width,
                x: currentLine.width,
                parentId: ref.index,
                startIndex: ref.start,
            });
            currentLine.width += metrics.width;

            const descent = measure("Mg").actualBoundingBoxDescent;
            if (descent > currentLine.maxDescent) currentLine.maxDescent = descent;
            if (style.fontSize > currentLine.maxFontSize) currentLine.maxFontSize = style.fontSize;
        }

        wordBuffer = [];
    }

    for (let j = 0; j < spans.length; j++) {
        const span = spans[j];
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
                currentLine.spans.push({
                    text: token,
                    style,
                    width: spaceWidth,
                    x: currentLine.width,
                    parentId: j,
                    startIndex: offset,
                    charOffsets: generateOffsets(token, style)
                });
                currentLine.width += spaceWidth;

                const descent = measure("Mg").actualBoundingBoxDescent;
                if (descent > currentLine.maxDescent) currentLine.maxDescent = descent;
                if (style.fontSize > currentLine.maxFontSize) currentLine.maxFontSize = style.fontSize;
            } else {
                wordBuffer.push({ span, text: token, index: j, start: offset })
            }
            offset += token.length;
        }

    }

    if (spans.length === 1 && spans[0].text.length === 0) wordBuffer.push({ span: spans[0], text: "", index: 0, start: 0 });

    flushWordBuffer();

    if (currentLine.spans.length > 0) {
        currentLine.x = generateLineOffset(alignment, maxWidth, currentLine.width);
        currentLine.height = lineHeight * currentLine.maxFontSize;
        currentLine.baseline = currentLine.height - currentLine.maxDescent;
        lines.push(currentLine);
    }

    return lines;
}

function buildBlock(block: ModelBlock, offset: number, maxWidth: number, blockStyle: BaseTextStyle) {
    const visualBlock: VisualBlock = {
        lines: [],
        y: offset,
        style: blockStyle,
        height: 0,
    };

    const lines = buildVisualLines(block.spans, maxWidth, blockStyle);

    const { y, height } = lines[lines.length - 1];
    visualBlock.height = y + height;
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
