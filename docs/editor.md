# Editor

The scenario editor consists of a few different features that makes both simple and complex scenarios possible.

## Creating a Scene

To create a new scene, press the plus button at the bottom of the scenes list, which is on the left side of the screen. This will create an empty scene with a default name. To rename the scene, expand the scene details section and modify the name input.

## Manipulating Scene Content

A scene can contain images, text and a few different shapes. To add any of these to the scene, press the associated icon in the topbar, and for a textbox or shape, drag your mouse on the canvas area to set the initial size and location. When adjusting any content, you can use the following shortcuts:

| Shortcut | Action |
| -------- | ------ |
| Shift    | Lock aspect ratio |
| Ctrl     | Resize from center |
| Shift (Rotating) | Increment by 15 deg |

### Audio Content

You can also add audio to a scene, by expanding the **Audio Elements** section and pressing the plus button. The app only supports `.mp3` audio files. All audio content in a scene will begin playing as soon as player navigates to the scene. The **Loop Audio** toggle adjusts whether the audio should continue playing as long as the user is on the scene, or whether it should end once it plays through once. Regardless of this option, the audio playback will end as soon as the player navigates away from the scene.

## Transitioning Between Scenes

Scene transitions are performed when the player presses any scene content that has a **link** attached to it. This can be images, textboxes or shapes. To add a link to a scene element, select the element and then expand the **Link Details** section that appears on the right. Press the **Next Scene** input to select the scene this element should link to. 

Importantly, if an element doesn't have a link or action attached to it, that element will become *passthrough*, which means that it wont respond to mouse input at all. Therefore you can put other interactive elements underneath, and they will work as expected.

## How to Track Scenario Progress

Scenario progress in VPS is managed by **tracked values** and **actions**. 

### Tracked Values

Tracked values are any values that you want to keep track of as the player progresses through the scenario. Some examples of useful tracked values are:

- A player's score
- Whether a specific choice has been made
- A character's health
- Some player input

To create a tracked value, press the **State Variables** button on the very left of the toolbar. On the modal, enter a name that describes what this value is tracking, the type of the value, and what the value should be initially (when the player first begins the scenario), and then press **Create** on the bottom right of the input section.

This table explains the different types:

| Name | Meaning | Example |
| ---- | ------- | ------- |
| String | A text value | A character's mood can be "happy", "sad" or "angry" |
| Number | A positive or negative number | A player's score |
| Boolean | A value that can be either true or false | Whether a player has visited a specific scene |

### Actions

To make tracked values useful, you need to update them as the player progresses through the scenario. To do this, you need to add actions to **scene elements**, just like adding links. After selecting an element, press the plus button on the **State Operations** section on the right, which should show a modal. On this dialog, select the tracked value you want to update and how you want to update it. This can be either:

- Set
- Add (number only)

Set will just set the tracked value to the value you specify in the input. For example, you might set the tracked value character mood to "happy". The add action will just perform addition to the tracked value. To perform subtraction, use the add action with a negative value.

A good way to think of actions are as sentences in the order *action type*, *tracked value*, *action value*, *scene element*:

- **Set** the **player-health** to **0**, when the player presses *the wrong option*.
- **Set** whether the player **has-requested-scans** to **true**, when the player presses *the request scans button*.
- **Add** to the **player-score** by **1**, when the player presses *the correct answer*.

## Showing the Scenario Progress

To let the user know about their progress, you can use a special format inside of any text in the scene, to display a tracked value inside of the text. This format is the tracked value name surrounded by two dollar signs on each side: `$$tracked-value$$`. For example, if we we're tracking the player health using a tracked value called `player-health`, we could write:

> Your current health is $$player-health$$ points

And then we could put this text in the top left of all of our scenes, so the player can always see it.

A more complex example would be tracking user input for prescribing medicine. You would have buttons with increment and decrement actions on a tracked value for dosage of each medication, and then a text box with $$medicine-x-dosage$$ above each pair of buttons. This way, you can create a numerical input within the scenario.

## Adding Resources

Resources are persistent media that the player can access from within any scene, which exist to give context to players as they make decisions. These resources can either be images or PDFs. To upload a resource, press the resources button at the top right of the editor, which will take you to the resources page. From here, you can upload, delete and group resources into collections.

To get started, you need to first create a collection by pressing the **Create** button next to the collections header. Once you've created the collection, you can press the plus button on the collection to upload the media for that resource. The player will now be able to access this resource while progressing through the scenario.

### Conditionally Showing Resources

Sometimes you might not want to have a resource always available for the player. For example, the scenario could involve the player requesting certain scans to be done on a patient. In this case, you would only want the player to see the 'scan' resource after they've made that decision. You can do this in the app using [tracked values](#tracked-values). 

First, you need to setup the tracked value for that resource if it doesn't yet exist. Then, you can select a resource and press the plus button on the **State Conditionals** section on the right. In the modal that appears, you need to select the *comparator* and the *comparison value*. The comparator can be either:

| Comparator | Meaning |
| ---------- | ------- |
| = | The tracked value is the same as the comparison value |
| != | The tracked value is **not** the same as the comparison value |
| > | The tracked value is greater than the comparison value |
| < | The tracked value is less than the comparison value |

Once you set this, the resource will only be shown to the player as long as that condition holds true. Therefore, you can swap resources easily as the player progresses to create a sense of change due to time or choice etc. In our scans example, the condition would be: *has_requested_scans* **=** *true*.

## Timing Scenes

Not yet implemented.

## Assigning Roles

Since the multiplayer playthrough of scenarios is intended to be role-based asynchronous multiplayer, you should be assigning roles to scenes. You can do this by selecting all of the roles that should be able to access that scene in the **Roles** input in the **Scene Details** section on the right.

