# Documentation: `features/authoring/scene/operations/text.ts`

## Feature

`features`

## Purpose

This file acts as a supporting utility, style sheet, configuration file, or shared helper within the frontend architecture.

## Components On Page

- No directly declared React component detected.

## Components Used On Page

- `../scene`
- `../../text/types`
- `../../text/build`
- `../../stores/editor`
- `../../util`
- `zustand/shallow`
- `./modifiers`

## Related Files

- `features/authoring/scene/operations/modifiers.ts`
- `features/authoring/scene/scene.ts`
- `features/authoring/stores/editor.ts`
- `features/authoring/text/build.ts`
- `features/authoring/text/types.ts`
- `features/authoring/util.ts`

## Important Change Notes

!!These files must be checked before making changes as you don't want to repeat code logic!!

The following files share logic, state management, rendering flow, styling, or utility responsibilities with this file:

- `features/authoring/scene/operations/modifiers.ts`
- `features/authoring/scene/scene.ts`
- `features/authoring/stores/editor.ts`
- `features/authoring/text/build.ts`
- `features/authoring/text/types.ts`
- `features/authoring/util.ts`

## Technical Breakdown

- File type: `.ts`
- Total lines: `489`
- Exported items: `insertChar, deleteChar, insertSelection, deleteSelection, createBlock, applySelectionStyle, getStyleForSelection, normaliseCursor, normaliseDocument, getDocumentText, getSelectionContent, mergeDocs`
- Imported dependency count: `7`
- Related local file count: `6`
