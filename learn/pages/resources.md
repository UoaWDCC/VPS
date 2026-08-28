---
title: Player Documents
description: Player documents are persistent media that players can access from within any scene to help them make decisions.
layout: libdoc_page.liquid
eleventyNavigation:
  key: Player Documents
  parent: Getting Started
  order: 3
---

Player documents are persistent media that the player can access from any scene to provide additional context while they make decisions. These documents can either be images or PDFs. They are separate from the images and audio you place on the canvas, which belong to a single scene.

## Adding Player Documents

To upload a document, press the **Player Documents** button above the scene list on the left of the editor, which will take you to the player documents page. From here, you can upload, delete and group documents into collections.

To get started, you need to first create a collection by pressing the **Create** button next to the collections header. Once you've created the collection, you can press the plus button on the collection to upload the media for that document. The player can now access this document as they progress through the scenario.

## Conditionally Showing Player Documents

Sometimes you might not want a document to be available to the player at all times. For example, the scenario could involve the player requesting certain scans for a patient. In that case, you would only want the player to see the scan results after they've made that decision. You can do this using [properties](/properties/).

First, set up the property for that document if it doesn't yet exist. Then, select a document and press the plus button on the **Visibility Conditionals** section on the right. In the modal that appears, select the _comparator_ and the _comparison value_. The comparator can be either:

| Comparator | Meaning                                                  |
| ---------- | -------------------------------------------------------- |
| =          | The property is the same as the comparison value         |
| !=         | The property is **not** the same as the comparison value |
| >          | The property is greater than the comparison value        |
| <          | The property is less than the comparison value           |

Once set, the document will only be shown to the player while they meet the condition. This lets you swap documents in and out as the player progresses, creating a sense of change over time or through choice. In the scans example, the condition would be: _has_requested_scans_ **=** _true_.
