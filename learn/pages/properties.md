---
title: Properties & Logic
description: Properties and actions let you record player choices and drive conditional behaviour as a player progresses through a scenario.
layout: libdoc_page.liquid
eleventyNavigation:
  key: Properties & Logic
  parent: Getting Started
  order: 2
---

Scenario progress in VPS is managed by **properties** and **actions**.

## Properties

Properties are any values that you want to keep track of as the player progresses through the scenario. Some examples of useful properties are:

- A player's score
- Whether a specific choice has been made
- A character's health
- Some player input

To create a property, press the **Properties** button above the scene list on the left of the editor. On the modal, enter a name that describes what this property is tracking, the type of the value, and what the value should be initially (when the player first begins the scenario). Finally, press **Create** on the bottom right of the input section.

This table explains the different types:

| Name    | Meaning                                  | Example                                             |
| ------- | ---------------------------------------- | --------------------------------------------------- |
| String  | A text value                             | A character's mood can be "happy", "sad" or "angry" |
| Number  | A positive or negative number            | A player's score                                    |
| Boolean | A value that can be either true or false | Whether a player has visited a specific scene       |

## Actions

To make properties useful, you need to update them as the player progresses through the scenario. To do this, you need to add actions to **scene elements**, just like adding links. After selecting an element, press the plus button in the **Property Operations** section on the right; a modal should appear. In this dialog box, select the property you want to update and how to update it. This can be either:

- Set
- Add (number only)
- Subtract (number only)

Set will just set the property to the value you specify in the input. For example, you might set the property called "character mood" to "happy". The add action will perform addition to the property. To perform subtraction, use the subtract action.

A good way to think of actions is as sentences in the order _action type_, _property_, _action value_, _scene element_:

- **Set** the **player-health** to **0**, when the player presses _the wrong option_.
- **Set** whether the player **has-requested-scans** to **true**, when the player presses _the request scans button_.
- **Add** to the **player-score** by **1**, when the player presses _the correct answer_.

## Displaying Properties in the Scene

To let the player know about their progress, you can embed a property value directly inside any text in the scene. Wrap the property name in two dollar signs on each side: `$$property name$$`. For example, if you were tracking player health using a property called `player-health`, you could write:

> Your current health is $$player-health$$ points

You can place this text in the top left of all your scenes so the player can always see it.

A more complex example would be tracking user input for prescribing medicine. You would have buttons with increment and decrement actions on a property for the dosage of each medication, and a text box labelled $$medicine-x-dosage$$ above each pair of buttons. This way, you can create a numerical input within the scenario.

## Binding Properties to Scene Elements

Properties can also control scene elements while a scenario is being played. For example, binding a box's **X position** to a number property named `playerX` makes the box move whenever an action changes `playerX`.

To create a Property Binding:

1. Select the scene element on the canvas.
2. Open **Property Bindings** in the right sidebar and press the plus button.
3. Select the component property to control.
4. Select a property of the required type and press **Create**.

Bindings support position, size, rotation, layer order, click-ability, fills, and
strokes where applicable. The property type must match the property type
shown in the binding dialog.
Bindings are applied during play mode; the element's saved authoring value is
used as a fallback if its property is missing or has an incompatible type.

You can combine bindings with actions to build interactive elements. A
`playerX` number could begin at `100`; one button could subtract `20` from it and
another could add `20`. Binding a box's **X position** to `playerX` then creates
a simple left/right-controlled sprite.

## Next Steps

Properties can also control which [Player Documents](/resources/) are visible to the player at any given point in the scenario.
