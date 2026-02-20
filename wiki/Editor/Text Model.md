# Text Model

The text model is going to be a tree structure to support span based styling, similar to other editors like google slides.

> [!WARNING]
> Use the types defined in the codebase as the actual source of truth, since this document might not reflect any minor changes made in the actual implementation 

## Text Structure

### Text Shape

The highest level text structure, used for standard text boxes and other components like buttons.

```ts
interface TextShape {
	id: string;
	type: "text";
	x: number;
	y: number;
	width: number;
	height: number;
	blocks: TextBlock[];
	style?: Partial<BaseTextStyle>;
}
```

### Text Block

Represents paragraph blocks.

```ts
interface TextBlock {
	id: string;
	style?: Partial<BlockTextStyle>;
	spans: TextSpan[];
}
```

### Text Span

```ts
interface TextSpan {
	text: string;
	style?: Partial<SpanTextStyle>;
}
```

## Style Structure

The lower level properties (block and span) take precedence over the base properties when both are defined.

```ts
interface BaseTextStyle extends BlockTextStyle, SpanTextStyle {}

interface BlockTextStyle {
	alignment: "left" | "centre" | "right";
	lineHeight: number;
}

interface SpanTextStyle {
	fontFamily: "string";
	fontSize: number;
	fontWeight: string;
	fontStyle: string;
	textDecoration: string;
	textColor: HexString;
	highlightColor: HexString;
}
```
