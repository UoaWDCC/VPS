// The model writes a little markdown whether asked to or not: bold, lists,
// tables, code. This reads just those, so the panel can show them properly.
// It makes a description of what to draw rather than HTML, so nothing the model
// writes can add markup to the page.

export type Inline =
  | { kind: "text"; text: string }
  | { kind: "bold"; text: string }
  | { kind: "italic"; text: string }
  | { kind: "code"; text: string };

export type RichBlock =
  | { kind: "paragraph"; inline: Inline[] }
  | { kind: "heading"; inline: Inline[] }
  | { kind: "list"; ordered: boolean; items: Inline[][] }
  | { kind: "table"; header: Inline[][]; rows: Inline[][][] }
  | { kind: "code"; text: string };

/** `**bold**`, `*italic*` and `code` inside a line. */
export function parseInline(text: string): Inline[] {
  const parts: Inline[] = [];
  const pattern = /(\*\*([^*]+?)\*\*|`([^`]+?)`|\*([^*\s][^*]*?)\*)/g;
  let last = 0;

  for (const match of text.matchAll(pattern)) {
    const start = match.index ?? 0;
    if (start > last)
      parts.push({ kind: "text", text: text.slice(last, start) });
    if (match[2] !== undefined) parts.push({ kind: "bold", text: match[2] });
    else if (match[3] !== undefined)
      parts.push({ kind: "code", text: match[3] });
    else parts.push({ kind: "italic", text: match[4] });
    last = start + match[0].length;
  }
  if (last < text.length) parts.push({ kind: "text", text: text.slice(last) });
  return parts;
}

const BULLET = /^\s*(?:[-*•])\s+(.*)$/;
const NUMBERED = /^\s*\d+[.)]\s+(.*)$/;
const HEADING = /^\s{0,3}#{1,6}\s+(.*)$/;
const TABLE_LINE = /^\s*\|.*\|\s*$/;
const TABLE_RULE = /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/;

function cells(line: string) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => parseInline(cell.trim()));
}

export function parseRichText(text: string): RichBlock[] {
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const blocks: RichBlock[] = [];
  let i = 0;

  const startsBlock = (line: string) =>
    !line.trim() ||
    line.trimStart().startsWith("```") ||
    TABLE_LINE.test(line) ||
    BULLET.test(line) ||
    NUMBERED.test(line) ||
    HEADING.test(line);

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i++;
    } else if (line.trimStart().startsWith("```")) {
      const code: string[] = [];
      i++;
      // an unclosed block, as a reply that's still arriving, runs to the end
      while (i < lines.length && !lines[i].trimStart().startsWith("```"))
        code.push(lines[i++]);
      i++;
      blocks.push({ kind: "code", text: code.join("\n") });
    } else if (TABLE_LINE.test(line)) {
      const rows: string[] = [];
      while (i < lines.length && TABLE_LINE.test(lines[i]))
        rows.push(lines[i++]);
      const data = rows.filter((row) => !TABLE_RULE.test(row)).map(cells);
      if (data.length)
        blocks.push({ kind: "table", header: data[0], rows: data.slice(1) });
    } else if (HEADING.test(line)) {
      blocks.push({
        kind: "heading",
        inline: parseInline(line.replace(HEADING, "$1")),
      });
      i++;
    } else if (BULLET.test(line) || NUMBERED.test(line)) {
      const ordered = NUMBERED.test(line);
      const pattern = ordered ? NUMBERED : BULLET;
      const items: Inline[][] = [];
      while (i < lines.length && pattern.test(lines[i]))
        items.push(parseInline(lines[i++].replace(pattern, "$1")));
      blocks.push({ kind: "list", ordered, items });
    } else {
      // a paragraph runs until something else starts; its line breaks stay
      const paragraph: string[] = [];
      while (i < lines.length && !startsBlock(lines[i]))
        paragraph.push(lines[i++]);
      blocks.push({
        kind: "paragraph",
        inline: parseInline(paragraph.join("\n")),
      });
    }
  }
  return blocks;
}
