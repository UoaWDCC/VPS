# Documentation: `features/authoring/text/cursor.ts`

## Feature

`features`

## Purpose

This file acts as a supporting utility, style sheet, configuration file, or shared helper within the frontend architecture.

## Components On Page

- No directly declared React component detected.

## Components Used On Page

- `../stores/editor`
- `../stores/visual`
- `../types`
- `../util`

## Related Files

- `features/authoring/stores/editor.ts`
- `features/authoring/stores/visual.ts`
- `features/authoring/types.ts`
- `features/authoring/util.ts`

## Important Change Notes

!!These files must be checked before making changes as you don't want to repeat code logic!!

The following files share logic, state management, rendering flow, styling, or utility responsibilities with this file:

- `features/authoring/stores/editor.ts`
- `features/authoring/stores/visual.ts`
- `features/authoring/types.ts`
- `features/authoring/util.ts`

## Technical Breakdown

- File type: `.ts`
- Total lines: `340`
- Exported items: `scanDocument, scanBlock, scanLine, scanSpan, toVisual, toModelSelection, toVisualSelection, syncModelSelection, syncVisualCursor, normaliseVisualCursor, getRelativePosition, parseHit, getVisualPosition, goToLineStart, goToLineEnd, moveCursorLine, normalizeSelectionVisual, moveCursorVisual`
- Imported dependency count: `4`
- Related local file count: `4`
