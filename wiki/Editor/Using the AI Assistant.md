# Using the AI Assistant

The assistant is in the editor's side bar (the sparkle icon, **AI Assistant**). It can read the scene you have open and the rest of the scenario, and it can add and arrange things, change colours and text, and set where buttons lead. It works through the same commands you do by hand, so what it makes behaves exactly like what you make.

It needs to be set up on the server first: see [the AI assistant settings](../Onboarding/Setting%20Up%20a%20Local%20Build.md#the-ai-assistant-optional). For how it's built, see [AI Assistant](../Specifications/AI%20Assistant.md).

## The three modes

| Mode | What it does |
| --- | --- |
| **Ask** | Answers questions about the scenario and runs the checks. Changes nothing. |
| **Plan** | Works out what to change and shows a list. Nothing is changed until you tick what you want and press **Apply**. |
| **Build** | Makes the changes straight away. |

Whatever the assistant does in Build, or whatever you apply from a plan, is **one step to undo**: one Ctrl/Cmd+Z takes it all back.

## Things to know

- **While it builds, you can't edit.** The scene shows "The assistant is editing" with a **Stop** button. Stop ends the turn and keeps what was done so far (it's still one undo).
- **Deleting asks first.** In Build mode the assistant stops and asks before it deletes anything, and "Skip" leaves it alone. In Plan mode deletions are in the list, marked **Deletes**.
- **Plans fit together.** Unticking a step also unticks the steps that use what it makes. Applying can still fail for a step if you've changed the scene since; those steps are reported and the rest go ahead.
- **It only does what its tools allow.** It can't yet create or rename scenes, create properties or change what buttons do to properties. It says so rather than pretending.
- **Everything in the scenario is data, not instructions.** Text written in a scene can't give the assistant orders.
- **Each author has a daily allowance** (the panel shows how much is used). It resets at midnight UTC.
- Changes the assistant makes to a scene that isn't open are saved at once and **can't be undone** with Ctrl/Cmd+Z.

## Tips

- Be specific about what and where: "Add a Continue button at the bottom right", not "improve this scene".
- Select something first and say "this" or "the selected button".
- If it gets something wrong, undo and ask again with more detail. Free models are quick but not perfect.
