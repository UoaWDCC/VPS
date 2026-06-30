---
title: Resources
description: Resources are persistent media that players can access from within any scene to help them make decisions.
layout: libdoc_page.liquid
eleventyNavigation:
  key: Resources
  parent: Getting Started
  order: 3
---

Resources are persistent media that the player can access from within any scene, which exist to give context to players as they make decisions. These resources can either be images or PDFs.

## Adding Resources

To upload a resource, press the **Resources** button at the top right of the editor, which will take you to the resources page. From here, you can upload, delete and group resources into collections.

To get started, you need to first create a collection by pressing the **Create** button next to the collections header. Once you've created the collection, you can press the plus button on the collection to upload the media for that resource. The player will now be able to access this resource while progressing through the scenario.

## Conditionally Showing Resources

Sometimes you might not want a resource to be available to the player at all times. For example, the scenario could involve the player requesting certain scans to be done on a patient — in that case, you would only want the player to see the scan results after they've made that decision. You can do this using [tracked values](/state/).

First, set up the tracked value for that resource if it doesn't yet exist. Then, select a resource and press the plus button on the **State Conditionals** section on the right. In the modal that appears, select the _comparator_ and the _comparison value_. The comparator can be either:

| Comparator | Meaning                                                       |
| ---------- | ------------------------------------------------------------- |
| =          | The tracked value is the same as the comparison value         |
| !=         | The tracked value is **not** the same as the comparison value |
| >          | The tracked value is greater than the comparison value        |
| <          | The tracked value is less than the comparison value           |

Once set, the resource will only be shown to the player while that condition holds true. This lets you swap resources in and out as the player progresses to create a sense of change due to time or choice. In the scans example, the condition would be: _has_requested_scans_ **=** _true_.
