---
title: Editor
description: The scenario editor includes several features that enable both simple and complex scenarios.
layout: libdoc_page.liquid
eleventyNavigation:
  key: Editor
  parent: Getting Started
  order: 1
---

## Creating a Scene

To create a new scene, press the plus button at the bottom of the scenes list on the left side of the screen. This will create an empty scene with a default name. To rename the scene, expand the scene details section and modify the name input.

## Manipulating Scene Content

A scene can contain images, text and a few different shapes. To add any of these to the scene, press the associated icon in the topbar, and for a textbox or shape, drag your mouse on the canvas area to set the initial size and location. When adjusting any content, you can use the following shortcuts:

| Shortcut         | Action              |
| ---------------- | ------------------- |
| Shift            | Lock aspect ratio   |
| Ctrl             | Resize from center  |
| Shift (Rotating) | Increment by 15 deg |

### Audio Content

You can also add audio to a scene by expanding the **Audio Elements** section and pressing the plus button. The app only supports `.mp3` audio files. All audio content in a scene will begin playing as soon as the player navigates to the scene. The **Loop Audio** toggle controls whether the audio continues to play as long as the user is on the scene, or ends after it plays once. Regardless of this option, the audio playback will end as soon as the player navigates away from the scene.

## Transitioning Between Scenes

Scene transitions are performed when the player presses any scene content that has a **link** attached to it. This can be images, textboxes or shapes. To add a link to a scene element, select the element and then expand the **Link Details** section that appears on the right. Press the **Next Scene** input to select the scene this element should link to.

Importantly, if an element doesn't have a link or action attached to it, that element will become _passthrough_, which means that it won't respond to mouse input at all. Therefore, you can put other interactive elements underneath, and they will work as expected.

## Assigning Roles

Since the multiplayer playthrough of scenarios is intended to be role-based and asynchronous, you should assign roles to scenes. You can do this by selecting all of the roles that should be able to access that scene in the **Roles** input in the **Scene Details** section on the right.

## Next Steps

- Track player choices and scores using [State & Logic](/state/).
- Add images and PDFs for players to reference from [Resources](/resources/).
