---
title: State & Logic
description: Tracked values and actions let you record player choices and drive conditional behaviour as a player progresses through a scenario.
layout: libdoc_page.liquid
eleventyNavigation:
  key: State & Logic
  parent: Getting Started
  order: 2
---

Scenario progress in VPS is managed by **tracked values** and **actions**.

## Tracked Values

Tracked values are any values that you want to keep track of as the player progresses through the scenario. Some examples of useful tracked values are:

- A player's score
- Whether a specific choice has been made
- A character's health
- Some player input

To create a tracked value, press the **State Variables** button on the very left of the toolbar. On the modal, enter a name that describes what this value is tracking, the type of the value, and what the value should be initially (when the player first begins the scenario), and then press **Create** on the bottom right of the input section.

This table explains the different types:

| Name    | Meaning                                  | Example                                             |
| ------- | ---------------------------------------- | --------------------------------------------------- |
| String  | A text value                             | A character's mood can be "happy", "sad" or "angry" |
| Number  | A positive or negative number            | A player's score                                    |
| Boolean | A value that can be either true or false | Whether a player has visited a specific scene       |

## Actions

To make tracked values useful, you need to update them as the player progresses through the scenario. To do this, you need to add actions to **scene elements**, just like adding links. After selecting an element, press the plus button in the **State Operations** section on the right; a modal should appear. In this dialog box, select the tracked value you want to update and how to update it. This can be either:

- Set
- Add (number only)

Set will just set the tracked value to the value you specify in the input. For example, you might set the tracked value character mood to "happy". The add action will perform addition to the tracked value. To perform subtraction, use the add action with a negative value.

A good way to think of actions is as sentences in the order _action type_, _tracked value_, _action value_, _scene element_:

- **Set** the **player-health** to **0**, when the player presses _the wrong option_.
- **Set** whether the player **has-requested-scans** to **true**, when the player presses _the request scans button_.
- **Add** to the **player-score** by **1**, when the player presses _the correct answer_.

## Displaying Tracked Values

To let the player know about their progress, you can embed a tracked value directly inside any text in the scene. Wrap the tracked value name in two dollar signs on each side: `$$tracked-value$$`. For example, if you were tracking player health using a tracked value called `player-health`, you could write:

> Your current health is $$player-health$$ points

You can place this text in the top left of all your scenes so the player can always see it.

A more complex example would be tracking user input for prescribing medicine. You would have buttons with increment and decrement actions on a tracked value for the dosage of each medication, and a text box labelled $$medicine-x-dosage$$ above each pair of buttons. This way, you can create a numerical input within the scenario.

## Binding Tracked Values to Scene Elements

Tracked values can also control the properties of scene elements while a
scenario is being played. For example, binding a box's **X position** to a
number tracked value named `playerX` makes the box move whenever an action
changes `playerX`.

To create a binding:

1. Select the scene element on the canvas.
2. Open **State Bindings** in the right sidebar and press the plus button.
3. Select the component property to control.
4. Select a tracked value of the required type and press **Create**.

Bindings support position, size, rotation, layer order, opacity, clickability,
fills, strokes, textbox padding, and image properties where applicable. The
tracked value type must match the property type shown in the binding dialog.
Bindings are applied during play mode; the element's saved authoring value is
used as a fallback if its tracked value is missing or has an incompatible type.

You can combine bindings with actions to build interactive elements. A
`playerX` number could begin at `100`; one button could add `-20` to it and
another could add `20`. Binding a box's **X position** to `playerX` then creates
a simple left/right-controlled sprite.

## Next Steps

Tracked values can also control which [Resources](/resources/) are visible to the player at any given point in the scenario.
