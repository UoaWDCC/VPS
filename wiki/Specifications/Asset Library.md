# Asset Library

The asset library is a panel in the editor (the library icon in the right-hand icon stack, under Scene Details and Audio) where authors find things to put in their scenes: ready-made buttons, icons and sounds, and files they've uploaded themselves.

The point is reuse. Before this, an upload belonged to one scenario, so using the same logo or sound in a second scenario meant uploading it again. Now an upload goes into the author's library once and can be used in any scenario they can edit.

## What's in it

There are two sources, shown as separate headings:

- **My uploads** are files the author uploaded: images, audio and documents. They are private to the uploader.
- **Presets** are built in and the same for everyone:
  - 8 **buttons**: primary, neutral, success, warning, danger, info, outline and oval
  - 10 **images**: simple medical and interface icons (first aid, heart, pill, thermometer, clipboard, tick, warning, info, arrow, speech bubble)
  - 3 **sounds**: a looping heart monitor, an alert and a chime

Everything has a name and **tags**. The search box matches every word against names and tags, so "fever" finds the thermometer and "emergency" finds first aid. The filter chips (All, Buttons, Images, Sounds, Documents) narrow it to one kind.

## Using an item

Clicking an item adds it, and whatever lands on the canvas ends up selected so the author can carry on editing it.

| Item | What happens |
| --- | --- |
| Preset button | A box (or ellipse) with text in it is added, centred on the canvas. It's an ordinary shape, so it can be restyled, moved and given a destination or property change in the Button Actions panel |
| Preset image | An image component is added at its natural size. It's shown from its static url and has no `fileId`, so it isn't reference counted |
| Preset sound | An audio element is added (the heart monitor starts with Loop on) |
| Uploaded image | The upload is made available to the scenario (see below), then added as an image component |
| Uploaded audio | Made available to the scenario, then added as an audio element |
| Uploaded document | Made available to the scenario, then added to the scenario's resources |

### Uploading

The Upload button, or dropping a file on the panel, asks for optional tags (comma separated) and adds the file to the library. Files are limited in the same way as any other upload (see [Uploading Media Files](../Uplading%20Media%20Files.md)): the size limit and allowed types come from `MAX_FILE_SIZE_MB` and `ALLOWED_MIME_LIST`.

Tags are tidied on the server: lowercase, no leading `#`, no duplicates, at most 10 tags of at most 30 characters.

### Removing

The bin on an upload removes it from the library. It never breaks a scene: scenarios that already used the file keep it, and the stored file is only deleted when nothing uses it any more.

## How it fits with scenario files

A scenario's `UploadedFile` records are what scenes reference, and they carry the reference counts and orphan tracking. The library doesn't change that. It adds one more collection:

- `Asset` is a library entry: name, type, tags, the stored file's `path` and `url`, and the `ownerUid`.
- Using an asset in a scenario (`POST /api/assets/:assetId/use`) creates an `UploadedFile` in that scenario pointing at the **same stored object**, with `assetId` set so it can be traced back. Using the same asset again in the same scenario returns the same file.

So the editor, scene saving and reference counting treat a library upload exactly like a direct one.

> [!WARNING]
> Several `UploadedFile` records (and the asset) can share one stored object. Whatever eventually deletes orphaned files from storage must not delete a `path` while any record still points at it. Removing an asset already checks this.

## Theming

The panel is built from the same daisyUI tokens and patterns as the other side panels (`bg-base-200`, `bg-base-300`, `btn`, `input`), so it follows `vps-dark` and `vps-light` without any theme-specific code. Things that will appear on the canvas are previewed on white, because the canvas is white in both themes.

Preset buttons and icons end up inside scenes, which store colours as plain hex values and can't use CSS variables. So their colours are written out in `library/palette.js`, with the theme token each one mirrors. A test (`presets.test.js`) reads `index.css` and fails if the palette drifts from the theme, and another checks that button text stays readable on its fill. If the theme changes, update the palette and regenerate the images.

## Changing the presets

Buttons, icons and sounds are listed in `library/presets.js`. The images and sounds themselves are generated, not downloaded, so there's nothing to license:

```
node scripts/generate-library-assets.mjs
```

This draws every icon from simple shapes using the palette colours and writes `public/library/images/*.png` and `public/library/audio/*.wav`. It needs nothing but Node, and it refuses to run if `presets.js` and the script disagree about which files should exist.

To add an icon: add an entry to `IMAGE_PRESETS`, draw it in `ICONS` in the script, run the script, and commit the new PNG. The tests check that every listed file exists, is a 512px PNG with transparency, and that tags are clean.

## Not done yet

- Renaming and re-tagging an upload from the panel. The API supports it (`PATCH /api/assets/:assetId`), there's just no UI for it yet.
- A shared pool that everyone can see. Uploads are private to the uploader on purpose, since they may contain student or patient material.
- Per-user storage limits.
